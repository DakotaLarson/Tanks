import Component from "../../component/ChildComponent";
import EventHandler from "../../EventHandler";
import BlockCreationTool from "./BlockCreationTool";
import GameSpawnCreationTool from "./GameSpawnCreationTool";
import InitialSpawnCreationTool from "./InitialSpawnCreationTool";
import TeamSpawnCreationTool from "./TeamSpawnCreationTool";

export default class CreationToolHandler extends Component {

    private blockCreationTool: BlockCreationTool;
    private gameSpawnCreationTool: GameSpawnCreationTool;
    private initialSpawnCreationTool: InitialSpawnCreationTool;
    private teamASpawnCreationTool: TeamSpawnCreationTool;
    private teamBSpawnCreationTool: TeamSpawnCreationTool;

    private mode: number;

    constructor() {
        super();
        this.blockCreationTool = new BlockCreationTool();
        this.gameSpawnCreationTool = new GameSpawnCreationTool();
        this.initialSpawnCreationTool = new InitialSpawnCreationTool();
        this.teamASpawnCreationTool = new TeamSpawnCreationTool(0);
        this.teamBSpawnCreationTool = new TeamSpawnCreationTool(1);
        this.mode = Mode.CAMERA;
    }

    public enable() {
        EventHandler.addListener(this, EventHandler.Event.GAMEMENU_OPEN, this.removeTool);
        EventHandler.addListener(this, EventHandler.Event.GAMEMENU_CLOSE, this.addTool);

        EventHandler.addListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_BLOCK, this.onToggleToBlock);
        EventHandler.addListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_CAMERA, this.onToggleToCamera);
        EventHandler.addListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_GAMESPAWN, this.onToggleToGameSpawn);
        EventHandler.addListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_INITIALSPAWN, this.onToggleToInitialSpawn);
        EventHandler.addListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_TEAM_A, this.onToggleToTeamA);
        EventHandler.addListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_TEAM_B, this.onToggleToTeamB);
    }

    public disable() {
        EventHandler.removeListener(this, EventHandler.Event.GAMEMENU_OPEN, this.removeTool);
        EventHandler.removeListener(this, EventHandler.Event.GAMEMENU_CLOSE, this.addTool);

        EventHandler.removeListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_BLOCK, this.onToggleToBlock);
        EventHandler.removeListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_CAMERA, this.onToggleToCamera);
        EventHandler.removeListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_GAMESPAWN, this.onToggleToGameSpawn);
        EventHandler.removeListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_INITIALSPAWN, this.onToggleToInitialSpawn);
        EventHandler.removeListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_TEAM_A, this.onToggleToTeamA);
        EventHandler.removeListener(this, EventHandler.Event.ARENA_CREATE_MODE_TOGGLE_TEAM_B, this.onToggleToTeamB);
    }

    private onToggleToCamera() {
        this.removeTool();
        this.mode = Mode.CAMERA;
    }

    private onToggleToBlock() {
        this.removeTool();
        this.attachChild(this.blockCreationTool);
        this.mode = Mode.BLOCK;
    }

    private onToggleToGameSpawn() {
        this.removeTool();
        this.attachChild(this.gameSpawnCreationTool);
        this.mode = Mode.GAMESPAWN;
    }

    private onToggleToInitialSpawn() {
        this.removeTool();
        this.attachChild(this.initialSpawnCreationTool);
        this.mode = Mode.INITIALSPAWN;
    }

    private onToggleToTeamA() {
        this.removeTool();
        this.attachChild(this.teamASpawnCreationTool);
        this.mode = Mode.TEAM_A;
    }

    private onToggleToTeamB() {
        this.removeTool();
        this.attachChild(this.teamBSpawnCreationTool);
        this.mode = Mode.TEAM_B;
    }

    private removeTool() {
        switch (this.mode) {
            case Mode.BLOCK:
                this.detachChild(this.blockCreationTool);
                break;
            case Mode.GAMESPAWN:
                this.detachChild(this.gameSpawnCreationTool);
                break;
            case Mode.INITIALSPAWN:
                this.detachChild(this.initialSpawnCreationTool);
                break;
            case Mode.TEAM_A:
                this.detachChild(this.teamASpawnCreationTool);
                break;
            case Mode.TEAM_B:
                this.detachChild(this.teamBSpawnCreationTool);
                break;
        }
    }

    private addTool() {
        switch (this.mode) {
            case Mode.BLOCK:
                this.attachChild(this.blockCreationTool);
                break;
            case Mode.GAMESPAWN:
                this.attachChild(this.gameSpawnCreationTool);
                break;
            case Mode.INITIALSPAWN:
                this.attachChild(this.initialSpawnCreationTool);
                break;
            case Mode.TEAM_A:
                this.attachChild(this.teamASpawnCreationTool);
                break;
            case Mode.TEAM_B:
                this.attachChild(this.teamBSpawnCreationTool);
                break;
        }
    }
}

enum Mode {
    CAMERA,
    BLOCK,
    GAMESPAWN,
    INITIALSPAWN,
    TEAM_A,
    TEAM_B,
}
