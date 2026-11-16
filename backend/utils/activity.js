import { activityLogModel } from "../models/index.js";

export async function logActivity({ actorType, actorId = null, action, rideId = null, details = null }, transaction) {
    try {
        await activityLogModel.create({
            actorType,
            actorId: actorId === null ? null : String(actorId),
            action,
            rideId,
            details: details ? String(details).slice(0, 500) : null,
        }, { transaction });
    } catch (error) {
        // Log-u nuk duhet të prishë veprimin kryesor
        console.error("Unable to write activity log:", error.message);
    }
}
