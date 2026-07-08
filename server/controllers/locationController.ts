import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Location from "../models/Location";

export async function getAllLocations(req: AuthRequest, res: Response) {
  try {
    const locations = await Location.find({});
    res.json(locations);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to locate positions database.", error: err.message });
  }
}

export async function createLocation(req: AuthRequest, res: Response) {
  try {
    const { locationName, locationCode } = req.body;

    if (!locationName || !locationCode) {
      res.status(400).json({ message: "Location Name and unique Location Code are required." });
      return;
    }

    const codeUpper = locationCode.trim().toUpperCase();

    const duplicate = await Location.findOne({ locationCode: codeUpper });
    if (duplicate) {
      res.status(400).json({ message: `Location code '${codeUpper}' already registered.` });
      return;
    }

    const newLoc = new Location({
      locationName: locationName.trim(),
      locationCode: codeUpper,
    });
    await newLoc.save();
    res.status(201).json(newLoc);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create location space.", error: err.message });
  }
}

export async function updateLocation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { locationName, locationCode } = req.body;

    if (!locationName || !locationCode) {
      res.status(400).json({ message: "Location Name and Location Code are required for updates." });
      return;
    }

    const codeUpper = locationCode.trim().toUpperCase();

    const duplicate = await Location.findOne({
      locationCode: codeUpper,
      _id: { $ne: id },
    });
    if (duplicate) {
      res.status(400).json({ message: `Location code '${codeUpper}' is already assigned to another space.` });
      return;
    }

    const updated = await Location.findByIdAndUpdate(
      id,
      {
        locationName: locationName.trim(),
        locationCode: codeUpper,
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      res.status(404).json({ message: "Location registered entry not found." });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update location parameters.", error: err.message });
  }
}

export async function deleteLocation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const deleted = await Location.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: "Location not found." });
      return;
    }
    res.json({ message: "Location master entry deleted successfully from system." });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete location.", error: err.message });
  }
}