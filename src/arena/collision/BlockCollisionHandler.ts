import {Vector3 } from "three";
import CollisionUtils from "./CollisionUtils";

export default class BlockCollisionHandler {

    public static getCollision(pos: Vector3, rot: number, offsetX: number, offsetZ: number): Vector3 {

        const blockPos = pos.clone().floor();

        const testBlockPositions: Vector3[] = new Array();
        for (let x = blockPos.x - 1; x <= blockPos.x + 1; x ++) {
            for (let z = blockPos.z - 1; z <= blockPos.z + 1; z ++) {
                const testPos = new Vector3(x, 0, z);
                if (BlockCollisionHandler.isPositionBlock(testPos)) {
                    testBlockPositions.push(testPos);
                }
            }
        }
        if (testBlockPositions.length) {
            const playerCornerPositions = CollisionUtils.getPlayerCorners(pos, rot, offsetX, offsetZ);

            const axes = CollisionUtils.getAxes(rot, 0);

            const totalCorrection = new Vector3();

            for (const blockPosition of testBlockPositions) {

                const blockCornerPositions = CollisionUtils.getBlockCorners(blockPosition);

                const overlaps = CollisionUtils.getOverlaps(axes, playerCornerPositions, blockCornerPositions);

                if (overlaps) {

                    const mtv = CollisionUtils.getMTV(overlaps);
                    totalCorrection.add(mtv);
                }
            }
            return totalCorrection;
        }
        return new Vector3();
    }

    public static updateBlockPositions(positions: Vector3[] | undefined) {
        BlockCollisionHandler.blockPositions = positions ? positions : [];
    }

    private static blockPositions: Vector3[] = [];

    private static isPositionBlock(pos: Vector3) {
        for (const blockPosition of BlockCollisionHandler.blockPositions) {
            if (blockPosition.equals(pos)) { return true; }
        }
        return false;
    }
}
