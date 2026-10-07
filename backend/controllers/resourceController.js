import { models } from '../models/index.js';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const getAll = (resourceName) => async (req, res) => {
  try {
    const Model = models[resourceName];
    if (!Model) return res.status(404).json({ message: 'Resource not found' });
    const items = await Model.find({});
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getById = (resourceName) => async (req, res) => {
  try {
    const Model = models[resourceName];
    if (!Model) return res.status(404).json({ message: 'Resource not found' });
    const item = await Model.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = (resourceName) => async (req, res) => {
  try {
    const Model = models[resourceName];
    if (!Model) return res.status(404).json({ message: 'Resource not found' });
    const id = req.body.id || generateId();
    const newItem = new Model({ ...req.body, id });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const update = (resourceName) => async (req, res) => {
  try {
    const Model = models[resourceName];
    if (!Model) return res.status(404).json({ message: 'Resource not found' });
    const id = req.params.id;
    const updated = await Model.findOneAndUpdate(
      { id },
      { $set: { ...req.body, id } },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const remove = (resourceName) => async (req, res) => {
  try {
    const Model = models[resourceName];
    if (!Model) return res.status(404).json({ message: 'Resource not found' });
    const deleted = await Model.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
