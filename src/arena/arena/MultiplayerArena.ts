import EventHandler from "../../EventHandler";
import Globals from "../../Globals";
import PlayerCollisionHandler from "../collision/PlayerCollisionHandler";
import ConnectedPlayer from "../player/ConnectedPlayer";
import Player from "../player/Player";
import Arena from "./Arena";

export default class MultiplayerArena extends Arena {

    private static readonly OOB_ID = -1; // Out of Bounds Id

    private player: Player | undefined;
    private playerId: number | undefined;
    private connectedPlayers: Map<number, ConnectedPlayer>;

    private playerDetails: Map<number, any>;

    constructor() {
        super();

        this.player = undefined;

        this.connectedPlayers = new Map();
        this.playerDetails = new Map();

        PlayerCollisionHandler.clearPlayers();
    }

    public enable() {
        super.enable();

        EventHandler.addListener(this, EventHandler.Event.CONNECTED_PLAYER_JOIN, this.onPlayerJoin);
        EventHandler.addListener(this, EventHandler.Event.CONNECTED_PLAYER_LEAVE, this.onPlayerLeave);
        EventHandler.addListener(this, EventHandler.Event.PLAYER_ADDITION, this.onPlayerAddition);
        EventHandler.addListener(this, EventHandler.Event.PLAYER_REMOVAL, this.onPlayerRemoval);
        EventHandler.addListener(this, EventHandler.Event.PLAYER_MOVE, this.onPlayerMove);

        EventHandler.addListener(this, EventHandler.Event.CONNECTED_PLAYER_ADDITION, this.onConnectedPlayerAddition);
        EventHandler.addListener(this, EventHandler.Event.CONNECTED_PLAYER_MOVE, this.onConnectedPlayerMove);
        EventHandler.addListener(this, EventHandler.Event.CONNECTED_PLAYER_REMOVAL, this.onConnectedPlayerRemoval);
    }

    public disable() {
        super.disable();

        EventHandler.removeListener(this, EventHandler.Event.CONNECTED_PLAYER_JOIN, this.onPlayerJoin);
        EventHandler.removeListener(this, EventHandler.Event.CONNECTED_PLAYER_LEAVE, this.onPlayerLeave);
        EventHandler.removeListener(this, EventHandler.Event.PLAYER_ADDITION, this.onPlayerAddition);
        EventHandler.removeListener(this, EventHandler.Event.PLAYER_REMOVAL, this.onPlayerRemoval);
        EventHandler.removeListener(this, EventHandler.Event.PLAYER_MOVE, this.onPlayerMove);

        EventHandler.removeListener(this, EventHandler.Event.CONNECTED_PLAYER_ADDITION, this.onConnectedPlayerAddition);
        EventHandler.removeListener(this, EventHandler.Event.CONNECTED_PLAYER_MOVE, this.onConnectedPlayerMove);
        EventHandler.removeListener(this, EventHandler.Event.CONNECTED_PLAYER_REMOVAL, this.onConnectedPlayerRemoval);

        this.connectedPlayers.clear();
        this.playerDetails.clear();
        PlayerCollisionHandler.clearPlayers();
        this.player = undefined;
        this.playerId = undefined;
    }

    private onPlayerJoin(player: any) {
        this.playerDetails.set(player.id, {
            name: player.name,
        });
    }

    private onPlayerLeave(player: any) {
        this.playerDetails.delete(player.id);
    }

    private onPlayerAddition(data: any) {
        if (this.player) {
            console.warn("Attempting to attach player when one already exists");
            this.detachChild(this.player);
        }
        this.player = new Player(data.id, data.color, data.pos);
        this.playerId = data.id;
        this.attachChild(this.player);
        PlayerCollisionHandler.addPlayer(this.player);
        this.playerDetails.get(data.id).color = data.color;
    }

    private onPlayerRemoval(data: any) {
        this.updateKillfeed(data.id, data.involvedId, data.livesRemaining);
        this.displayFirework(data.involvedId, this.player!);
        this.detachChild(this.player as Player);
        PlayerCollisionHandler.removePlayer(this.player as Player);
        this.player = undefined;
    }

    private onPlayerMove(data: any) {
        if (data.fromServer && this.player) {
            this.player.position = data.pos;
            this.player.bodyRotation = data.bodyRot;
            this.player.headRotation = data.headRot;
        }
    }

    private onConnectedPlayerAddition(data: any) {
        if (this.connectedPlayers.has(data.id)) {
            console.warn("Attempting to attach connected player when one with the same id exists");
            this.detachChild(this.connectedPlayers.get(data.id) as ConnectedPlayer);
        }
        const player = new ConnectedPlayer(data.id, data.name, data.color, data.pos, data.headRot);
        this.connectedPlayers.set(data.id, player);
        this.attachChild(player);
        PlayerCollisionHandler.addPlayer(player);
        this.playerDetails.get(data.id).color = data.color;
    }

    private onConnectedPlayerMove(data: any) {
        if (!data.interpolated) {
            const player = this.connectedPlayers.get(data.id);
            if (player) {
                player.updatePosition(data.pos, data.movementVelocity, data.rotationVelocity, data.bodyRot, data.headRot, data.ramResponse);
            }
        }
    }

    private onConnectedPlayerRemoval(data: any) {
        const player = this.connectedPlayers.get(data.id);

        this.updateKillfeed(data.id, data.involvedId, data.livesRemaining);

        this.connectedPlayers.delete(data.id);
        if (player) {
            this.detachChild(player);
            PlayerCollisionHandler.removePlayer(player);

            this.displayFirework(data.involvedId, player);
        }
    }

    private updateKillfeed(id: number, involvedId: number, livesRemaining: number) {
        if (involvedId) {
            const mainPlayer = this.getKillfeedPlayerDetails(id, livesRemaining);
            const isOOB = involvedId === MultiplayerArena.OOB_ID;
            if (isOOB) {
                // The player went out of bounds
                if (mainPlayer) {
                    EventHandler.callEvent(EventHandler.Event.KILLFEED_UPDATE, {
                        mainPlayer,
                        isOOB,
                    });
                }
            } else {
                // The player was killed
                let involvedPlayer = this.getKillfeedPlayerDetails(involvedId, livesRemaining);
                if (!involvedPlayer) {
                    // The involved player has left the game
                    involvedPlayer = {
                        name: "A Ghost",
                        color: 0xffffff,
                        isSelf: false,
                        livesRemaining,
                    };
                }
                EventHandler.callEvent(EventHandler.Event.KILLFEED_UPDATE, {
                    mainPlayer,
                    involvedPlayer,
                    isOOB,
                });
            }
        }
    }

    private getKillfeedPlayerDetails(id: number, livesRemaining: number) {
        if (id === MultiplayerArena.OOB_ID) {
            return {
                name: Globals.getGlobal(Globals.Global.USERNAME),
                color: (this.player as Player).color,
                isSelf: true,
                livesRemaining,
            };
        } else {
            const isSelf = this.playerId === id;
            const details = this.playerDetails.get(id);
            if (details) {
                return {
                    name: details.name,
                    color: details.color,
                    isSelf,
                    livesRemaining,
                };
            } else {
                return undefined;
            }
        }
    }

    private displayFirework(involvedId: number, player: ConnectedPlayer | Player) {
        if (involvedId && involvedId !== MultiplayerArena.OOB_ID) {
            const position = player.position.clone().setY(0.5);

            EventHandler.callEvent(EventHandler.Event.FIREWORK_ADDITION, {
                position,
                color: player.color,
            });
        }
    }
}
