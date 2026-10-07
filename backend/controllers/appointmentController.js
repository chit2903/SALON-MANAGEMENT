import { Appointment } from '../models/index.js';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({});
    return res.json(appointments);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const id = req.body.id || generateId();
    const newAppointment = new Appointment({
      ...req.body,
      id,
      status: req.body.status || 'scheduled',
    });
    await newAppointment.save();
    return res.status(201).json(newAppointment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Appointment.findOneAndUpdate(
      { id },
      { $set: { ...req.body, id } },
      { new: true, upsert: true }
    );
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Appointment.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
