import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Asset from "../models/Asset";
import AssetMovement from "../models/AssetMovement";
import Department from "../models/Department";
import Location from "../models/Location";

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const total = await Asset.countDocuments({});
    const active = await Asset.countDocuments({ status: "Active" });
    const spare = await Asset.countDocuments({ status: "Spare" });
    const repair = await Asset.countDocuments({ status: "Under Repair" });
    const scrap = await Asset.countDocuments({ status: "Scrap" });

    res.json({
      totalAssets: total,
      activeAssets: active,
      spareAssets: spare,
      repairAssets: repair,
      scrapAssets: scrap,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to gather metrics.", error: err.message });
  }
}

export async function getDashboardCharts(req: AuthRequest, res: Response) {
  try {
    const departmentWise: Array<{ name: string; value: number }> = [];
    const locationWise: Array<{ name: string; value: number }> = [];
    const categoryWise: Array<{ name: string; value: number }> = [];

    const depts = await Asset.aggregate([
      { $group: { _id: "$departmentCode", count: { $sum: 1 } } }
    ]);
    const activeDepts = await Department.find({ isDeleted: { $ne: true } });
    activeDepts.forEach((d) => {
      const matching = depts.find((item) => item._id === d.departmentCode);
      departmentWise.push({ name: d.departmentName, value: matching ? matching.count : 0 });
    });

    const locGroups = await Asset.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } }
    ]);
    const activeLocs = await Location.find({});
    activeLocs.forEach((l) => {
      const matching = locGroups.find((item) => String(item._id) === String(l._id));
      locationWise.push({ name: l.locationName, value: matching ? matching.count : 0 });
    });

    const catGroups = await Asset.aggregate([
      { $group: { _id: "$equipmentName", count: { $sum: 1 } } }
    ]);
    catGroups.forEach((g) => {
      categoryWise.push({ name: g._id || "Other", value: g.count });
    });

    res.json({
      departmentWise,
      locationWise,
      categoryWise,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to gather chart data structure.", error: err.message });
  }
}

export async function getRecentActivities(req: AuthRequest, res: Response) {
  try {
    const recentAssets = await Asset.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("department")
      .populate("equipment");

    const recentTransfers = await AssetMovement.find({})
      .sort({ transferDate: -1 })
      .limit(5)
      .populate("fromEmployee")
      .populate("toEmployee")
      .populate("fromLocation")
      .populate("toLocation");

    res.json({
      recentAssets,
      recentTransfers,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to retrieve recent activities.", error: err.message });
  }
}
