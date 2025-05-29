import Farm from "../models/Farm.js";

class FarmController {
  async getMyFarms(req, res) {
    try {
      const farms = await Farm.find({ farmer: req.user.userId });
      res.json(farms);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async createFarm(req, res) {
    try {
      const { name, description, location, farmType, size, productionCapacity } = req.body;
      const images = req.files.map((file) => file.path);

      const farm = new Farm({
        farmer: req.user.userId,
        name,
        description,
        location,
        farmType,
        size,
        productionCapacity,
        images,
      });

      await farm.save();
      res.json(farm);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }

  async updateFarm(req, res) {
    try {
      const farm = await Farm.findOneAndUpdate(
        { _id: req.params.id, farmer: req.user.userId },
        req.body,
        { new: true }
      );

      if (!farm) {
        return res.status(404).json({ message: "Farm not found" });
      }

      res.json(farm);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
}

export default FarmController;
