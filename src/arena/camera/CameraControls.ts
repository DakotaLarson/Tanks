import Component from "../../component/ChildComponent";
import EventHandler from "../../EventHandler";

import {PerspectiveCamera, Spherical, Vector3} from "three";
import DomHandler from "../../DomHandler";

//    Rotate - left mouse
//    Zoom - middle mouse, or mousewheel
//    Pan - right mouse or keys

enum ButtonState {
    PRIMARY,
    SECONDARY,
    TERTIARY,
}

export default class CameraControls extends Component {

    public target: Vector3;
    public spherical: Spherical;

    private camera: PerspectiveCamera;
    private state: number;

    private zoomOnly: boolean;
    private listenForArenaUpdate: boolean;

    constructor(camera: PerspectiveCamera, zoomOnly: boolean, listenForArenaUpdate: boolean) {
        super();
        this.camera = camera;

        this.target = new Vector3();

        this.spherical = new Spherical(25, Math.PI / 4, 2 * Math.PI);
        this.update();

        this.state = -1;

        this.zoomOnly = zoomOnly;
        this.listenForArenaUpdate = listenForArenaUpdate;
    }

    public enable() {
        EventHandler.addListener(this, EventHandler.Event.DOM_MOUSEDOWN, this.onMouseDown);
        EventHandler.addListener(this, EventHandler.Event.DOM_MOUSEUP, this.onMouseUp);
        EventHandler.addListener(this, EventHandler.Event.DOM_MOUSEMOVE, this.onMouseMove);
        EventHandler.addListener(this, EventHandler.Event.DOM_WHEEL, this.onWheel);

        if (this.listenForArenaUpdate) {
            EventHandler.addListener(this, EventHandler.Event.ARENA_SCENE_UPDATE, this.onArenaSceneUpdate);
        }

        this.update();
    }

    public disable() {
        EventHandler.removeListener(this, EventHandler.Event.DOM_MOUSEDOWN, this.onMouseDown);
        EventHandler.removeListener(this, EventHandler.Event.DOM_MOUSEUP, this.onMouseUp);
        EventHandler.removeListener(this, EventHandler.Event.DOM_MOUSEMOVE, this.onMouseMove);
        EventHandler.removeListener(this, EventHandler.Event.DOM_WHEEL, this.onWheel);

        if (this.listenForArenaUpdate) {
            EventHandler.removeListener(this, EventHandler.Event.ARENA_SCENE_UPDATE, this.onArenaSceneUpdate);
        }
    }

    public update() {
        // @ts-ignore Incorrect assumption of void return type
        this.camera.position.setFromSpherical(this.spherical.makeSafe());
        this.camera.position.add(this.target);
        this.camera.lookAt(this.target);
    }

    private onMouseDown(event: MouseEvent) {
        if (this.state === -1) {
            switch (event.button) {
                case 0:
                    if (!this.zoomOnly) {
                        this.state = ButtonState.PRIMARY;
                    }
                    break;
                case 1:
                    this.state = ButtonState.TERTIARY;
                    break;
                case 2:
                    if (!this.zoomOnly) {
                        this.state = ButtonState.SECONDARY;
                    }
                    break;
            }
        }
    }

    private onMouseUp() {
        this.state = -1;
    }

    private onMouseMove(event: MouseEvent) {
        if (this.state === -1) { return; }
        switch (this.state) {
            case ButtonState.PRIMARY:
                this.onRotation(event.movementX, event.movementY);
                break;
            case ButtonState.SECONDARY:
                this.onPan(event.movementX, event.movementY);
                break;
            case ButtonState.TERTIARY:
                this.onZoom(event.movementY, false);
                break;
        }
    }

    private onWheel(event: MouseWheelEvent) {
        this.onZoom(event.deltaY, true);
    }

    private onRotation = (deltaX: number, deltaY: number) => {
         this.spherical.theta += deltaX * Math.PI / 180 / 3;
         this.spherical.phi += deltaY * Math.PI / 180 / 5;
         this.spherical.phi = Math.min(Math.PI / 2 - Math.PI / 24, this.spherical.phi);
         this.update();
    }

    private onPan = (deltaX: number, deltaY: number) => {
        const offset = new Vector3();
        const position = this.camera.position;
        offset.copy(position).sub(this.target);

        let targetDistance = offset.length();
        targetDistance *= Math.tan(this.camera.fov / 2 * Math.PI / 180);

        const yVec = new Vector3();
        const xVec = new Vector3();

        yVec.setFromMatrixColumn(this.camera.matrix, 0);
        xVec.copy(yVec);

        yVec.crossVectors(this.camera.up, yVec);
        yVec.multiplyScalar(2 * deltaY * targetDistance / DomHandler.getDisplayDimensions().height);
        this.target.add(yVec);

        xVec.multiplyScalar(-(2 * deltaX * targetDistance / DomHandler.getDisplayDimensions().height));
        this.target.add(xVec);
        this.update();
    }

    private onZoom(deltaY: number, isScroll: boolean) {
        if (isScroll) {
            if (deltaY > 0) {
                this.spherical.radius = Math.min(this.spherical.radius + 2, 100);
            } else {
                this.spherical.radius = Math.max(this.spherical.radius - 2, 3);
            }
        } else {
            this.spherical.radius = Math.max(Math.min(this.spherical.radius + deltaY / 10, 50), 3);
        }
        this.update();
    }

    private onArenaSceneUpdate(data: any) {
        this.target = new Vector3(data.width / 2, 0, data.height / 2);
        this.spherical = new Spherical(25, Math.PI / 4, Math.PI / 3);
        this.update();
    }
}
