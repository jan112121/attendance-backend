import PenaltyRules from '../models/penaltyRules.js';

/**
 * 📜 Get all rules
 */
export const getRules = async (req, res) => {
  try {
    const rules = await PenaltyRules.findAll();
    res.json(rules);
  } catch (err) {
    console.error('❌ Error fetching rules:', err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
};

/**
 * ➕ Add new rule
 */
export const createRule = async (req, res) => {
  try {
    const { condition, amount } = req.body;
    const rule = await PenaltyRules.create({ condition, amount });
    res.status(201).json(rule);
  } catch (err) {
    console.error('❌ Error creating rule:', err);
    res.status(500).json({ error: 'Failed to create rule' });
  }
};

/**
 * ✏️ Update rule
 */
export const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, amount } = req.body;
    const rule = await PenaltyRules.findByPk(id);

    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    await rule.update({ condition, amount });
    res.json({ message: 'Rule updated successfully', rule });
  } catch (err) {
    console.error('❌ Error updating rule:', err);
    res.status(500).json({ error: 'Failed to update rule' });
  }
};

/**
 * 🗑️ Delete rule
 */
export const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    await PenaltyRules.destroy({ where: { id } });
    res.json({ message: 'Rule deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting rule:', err);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
};
