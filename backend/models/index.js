import adminModel from "./adminModel.js";
import driverModel from "./driverModel.js";
import cityRouteModel from "./cityRouteModel.js";
import rideModel from "./rideModel.js";
import returnPromoModel from "./returnPromoModel.js";
import activityLogModel from "./activityLogModel.js";
import settingModel from "./settingModel.js";

// Lidhjet mes tabelave
driverModel.hasMany(rideModel, { foreignKey: "driverId", as: "rides" });
rideModel.belongsTo(driverModel, { foreignKey: "driverId", as: "driver" });

cityRouteModel.hasMany(rideModel, { foreignKey: "cityRouteId", as: "rides" });
rideModel.belongsTo(cityRouteModel, { foreignKey: "cityRouteId", as: "cityRoute" });

// Udhëtimi Tiranë → qytet krijon ofertën; udhëtimi i kthimit e "merr" atë
rideModel.hasOne(returnPromoModel, { foreignKey: "sourceRideId", as: "returnPromo" });
returnPromoModel.belongsTo(rideModel, { foreignKey: "sourceRideId", as: "sourceRide" });
returnPromoModel.belongsTo(rideModel, { foreignKey: "claimedRideId", as: "claimedRide", constraints: false });
rideModel.belongsTo(returnPromoModel, { foreignKey: "promoId", as: "promo", constraints: false });

driverModel.hasMany(returnPromoModel, { foreignKey: "driverId", as: "promos" });
returnPromoModel.belongsTo(driverModel, { foreignKey: "driverId", as: "driver" });
cityRouteModel.hasMany(returnPromoModel, { foreignKey: "cityRouteId", as: "promos" });
returnPromoModel.belongsTo(cityRouteModel, { foreignKey: "cityRouteId", as: "cityRoute" });

rideModel.hasMany(activityLogModel, { foreignKey: "rideId", as: "activity", constraints: false });
activityLogModel.belongsTo(rideModel, { foreignKey: "rideId", as: "ride", constraints: false });

export {
    adminModel, driverModel, cityRouteModel, rideModel,
    returnPromoModel, activityLogModel, settingModel,
};
