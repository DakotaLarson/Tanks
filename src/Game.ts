import Component from "./component/Component";
import EventHandler from "./EventHandler";

import { PerspectiveCamera } from "three";
import AlertMessageHandler from "./alert_message/AlertMessageHandler";
import ArenaHandler from "./arena/ArenaHandler";
import BackgroundAudioHandler from "./audio/BackgroundAudioHandler";
import Auth from "./Auth";
import ComponentDebugger from "./component/ComponentDebugger";
import ConnectionMenu from "./connection_menu/ConnectionMenu";
import DomHandler from "./DomHandler";
import GameStatusHandler from "./GameStatusHandler";
import Globals from "./Globals";
import MainMenu from "./main_menu/MainMenu";
import Metrics from "./Metrics";
import MultiplayerConnection from "./MultiplayerConnection";
import Options from "./Options";
import OverlayMenu from "./overlay_menu/OverlayMenu";
import ProfileViewer from "./ProfileViewer";

class Game extends Component {

    private mainMenu: MainMenu;
    private backgroundAudioHandler: BackgroundAudioHandler;
    private overlayMenu: OverlayMenu;
    private connectionScreen: ConnectionMenu;
    private arenaHandler: ArenaHandler;
    private mpConnection: MultiplayerConnection | undefined;
    private gameStatusHandler: GameStatusHandler;
    private alertMessageHandler: AlertMessageHandler;
    private options: Options;
    private auth: Auth;
    private metrics: Metrics;
    private profileViewer: ProfileViewer;

    private connectedToMultiplayer: boolean;

    constructor() {
        super();
        const perspectiveCamera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
        this.auth = new Auth();
        this.options = new Options();
        this.mainMenu = new MainMenu(perspectiveCamera);
        this.backgroundAudioHandler = new BackgroundAudioHandler();
        this.overlayMenu = new OverlayMenu();
        this.connectionScreen = new ConnectionMenu();
        this.arenaHandler = new ArenaHandler(perspectiveCamera);
        this.gameStatusHandler = new GameStatusHandler();
        this.alertMessageHandler = new AlertMessageHandler();
        this.metrics = new Metrics();
        this.connectedToMultiplayer = false;
        this.profileViewer = new ProfileViewer();
    }
    public enable() {
        EventHandler.callEvent(EventHandler.Event.GAME_START);

        EventHandler.addListener(this, EventHandler.Event.CREATEWORLDMENU_CREATE_OPT_CLICK, this.loadSingleplayer);
        EventHandler.addListener(this, EventHandler.Event.LOADWORLDMENU_LOAD_OPT_CLICK, this.loadSingleplayer);

        EventHandler.addListener(this, EventHandler.Event.SP_GAMEMENU_RETURN_TO_MAIN_REQUEST, this.unloadSingleplayer);

        EventHandler.addListener(this, EventHandler.Event.MULTIPLAYER_CONNECT_REQUEST, this.connectToMultiplayer);

        EventHandler.addListener(this, EventHandler.Event.MULTIPLAYER_DISCONNECT_REQUEST, this.disconnectFromMultiplayer);

        EventHandler.addListener(this, EventHandler.Event.OPTIONS_UPDATE, this.onOptionsUpdate);
        EventHandler.addListener(this, EventHandler.Event.DOM_BEFOREUNLOAD, this.onUnload);

        if (!this.setHost()) {
            EventHandler.addListener(this, EventHandler.Event.DOM_VISIBILITYCHANGE, this.onVisibilityChange);
        }

        this.attachComponent(this.auth);
        this.attachComponent(this.options);
        this.attachComponent(this.overlayMenu);
        this.attachComponent(this.backgroundAudioHandler);
        this.attachComponent(this.arenaHandler);
        this.updateMenu(true);
        this.attachChild(this.alertMessageHandler);
        this.hideLoadingScreen();
        if (Options.options.metricsEnabled) {
            this.attachChild(this.metrics);
        }
        this.attachComponent(this.profileViewer);
    }

    public update(delta: number) {
        EventHandler.callEvent(EventHandler.Event.GAME_ANIMATION_UPDATE, delta);
    }

    private onOptionsUpdate(event: any) {
        if (event.attribute === "metricsEnabled" && !event.data) {
            this.detachChild(this.metrics);
        }
    }

    private onUnload() {
        if (this.connectedToMultiplayer) {
            this.detachChild(this.mpConnection as MultiplayerConnection);
        }
    }

    private loadSingleplayer() {
        this.updateMenu(false);
    }

    private unloadSingleplayer() {
        this.updateMenu(true);
    }

    private connectToMultiplayer() {
        const address = "ws" + Globals.getGlobal(Globals.Global.HOST);
        this.updateMenu(false);
        this.attachChild(this.connectionScreen);
        this.mpConnection = new MultiplayerConnection(address, Globals.getGlobal(Globals.Global.AUTH_TOKEN));
        this.attachChild(this.mpConnection);
        this.attachChild(this.gameStatusHandler);
        this.connectedToMultiplayer = true;
    }

    private disconnectFromMultiplayer() {
        this.detachChild(this.connectionScreen);
        this.detachChild(this.mpConnection as MultiplayerConnection);
        this.detachChild(this.gameStatusHandler);
        this.mpConnection = undefined;
        this.updateMenu(true);
        this.connectedToMultiplayer = false;
    }

    private hideLoadingScreen() {
        DomHandler.getElement(".loading-screen").style.display = "none";
    }

    private updateMenu(enable: boolean) {
        if (enable) {
            this.attachChild(this.mainMenu);
        } else {
            this.detachChild(this.mainMenu);
        }
    }

    private setHost() {
        let isLocal = true;
        let address = "://" + location.hostname + ":8000";
        const host = location.hostname;
        const prodHostname = "battletanks.app";
        const stagingHostname = "dakotalarson.github.io";
        if (host.includes(prodHostname) || host.includes(stagingHostname)) {
            address = "s://battle-tanks-server.herokuapp.com";
            isLocal = false;
        }
        Globals.setGlobal(Globals.Global.HOST, address);
        return isLocal;
    }

    private onVisibilityChange() {
        if (document.hidden && this.connectedToMultiplayer) {
            EventHandler.callEvent(EventHandler.Event.MULTIPLAYER_DISCONNECT_REQUEST);
        }
    }
}

(() => {

    const TICK_INTERVAL = 50; // 20 ticks/second

    const game = new Game();
    game.enable();

    let prevTime = performance.now();
    let prevTickTime = performance.now();
    let prevDebugTime = prevTime;
    let debugFPSCount = 0;

    const update = () => {
        requestAnimationFrame(update);
        const currentTime = performance.now();
        if (currentTime - prevDebugTime > 1000) {
            outputDebugData();
            prevDebugTime = currentTime;
        }

        const delta = (currentTime - prevTime) / 1000;

        game.update(delta);

        const tickTime = currentTime - prevTickTime;
        if (tickTime > TICK_INTERVAL) {
            EventHandler.callEvent(EventHandler.Event.GAME_TICK);
            prevTickTime = prevTickTime + TICK_INTERVAL;
        }

        debugFPSCount ++;
        prevTime = currentTime;
    };
    update();

    const outputDebugData = () => {
        EventHandler.callEvent(EventHandler.Event.DEBUG_FPS, debugFPSCount);
        debugFPSCount = 0;
    };

    EventHandler.addListener(undefined, EventHandler.Event.DOM_KEYUP, (event) => {
        if (event.target.nodeName !== "INPUT" && event.code === "KeyP") {
            ComponentDebugger.printTable();
        }
    }, EventHandler.Level.LOW);
})();
