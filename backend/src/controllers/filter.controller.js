import {Filter} from '../models/filter.model.js';
// Save or Update Filters
export const saveFilters = async (req, res) => {
  try {
    const { userId } = req.body;
    const existingFilter = await Filter.findOne({ userId });

    if (existingFilter) {
      const updatedFilter = await Filter.findOneAndUpdate({ userId }, req.body, { new: true });
      return res.status(200).json(updatedFilter);
    }

    const newFilter = new Filter(req.body);
    await newFilter.save();
    res.status(201).json(newFilter);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', details: error.message });
  }
};

// Get Filters for a User
export const getFilters = async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = await Filter.findOne({ userId });
    if (!filters) return res.status(404).json({ error: 'No filters found' });

    res.status(200).json(filters);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', details: error.message });
  }
};
