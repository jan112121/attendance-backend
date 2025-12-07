import Penalties from '../models/penalties.js';
import Users from '../models/users.js';
import PenaltyRules from '../models/penaltyRules.js';
import moment from 'moment-timezone';

/**
 * 📦 GET /api/penalties
 * Fetch all penalties (joined with user info)
 */
export const getAllPenalties = async (_req, res) => {
  try {
    const penalties = await Penalties.findAll({
      include: [
        {
          model: Users,
          attributes: ['id', 'first_name', 'last_name', 'section', 'grade_id', 'student_number'], // select what you want to show
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(penalties);
  } catch (err) {
    console.error('❌ Error fetching penalties:', err);
    res.status(500).json({ error: 'Failed to fetch penalties' });
  }
};

/**
 * ➕ POST /api/penalties
 * (Optional) Create a penalty manually from admin
 */
export const createPenalty = async (req, res) => {
  try {
    const { user_id, reason, amount = 5 } = req.body;

    // 🔍 Check if the user already has unpaid penalties
    const existingPenalty = await Penalties.findOne({
      where: { user_id, status: 'unpaid' },
    });

    if (existingPenalty) {
      // ➕ Add ₱5 to the existing unpaid penalty
      existingPenalty.amount += amount;
      await existingPenalty.save();
      return res.json({
        message: `Updated existing penalty (added +${amount})`,
        penalty: existingPenalty,
      });
    }

    const penalty = await Penalties.create({
      user_id,
      reason,
      amount,
      status: 'unpaid',
    });

    res.status(201).json({ message: 'Penalty created successfully', penalty });
  } catch (err) {
    console.error('❌ Error creating penalty:', err);
    res.status(500).json({ error: 'Failed to create penalty' });
  }
};

/**
 * 🧾 PUT /api/penalties/:id
 * Update penalty (for changing amount, reason, or status)
 */
export const updatePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, amount, status } = req.body || {}; // ✅ Guard

    if (!reason && !amount && !status) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const penalty = await Penalties.findByPk(id);
    if (!penalty) return res.status(404).json({ error: 'Penalty not found' });

    await penalty.update({ reason, amount, status });

    res.json({ message: 'Penalty updated successfully', penalty });
  } catch (err) {
    console.error('❌ Error updating penalty:', err);
    res.status(500).json({ error: 'Failed to update penalty' });
  }
};

/**
 * ❌ DELETE /api/penalties/:id
 * Remove a penalty record
 */
export const deletePenalty = async (req, res) => {
  try {
    const { id } = req.params;

    const penalty = await Penalties.findByPk(id);
    if (!penalty) return res.status(404).json({ error: 'Penalty not found' });

    await penalty.destroy();
    res.json({ message: 'Penalty deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting penalty:', err);
    res.status(500).json({ error: 'Failed to delete penalty' });
  }
};

/**
 * ✅ PUT /api/penalties/:id/pay
 * Mark penalty as paid automatically
 */
export const markPenaltyAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const penalty = await Penalties.findByPk(id, {
      include: [{ model: Users, attributes: ['name', 'email'] }],
    });

    if (!penalty) return res.status(404).json({ error: 'Penalty not found' });

    penalty.status = 'paid';
    penalty.amount = 0; // reset to 0 after payment
    await penalty.save();

    // (Optional) audit log or email notification can go here later
    res.json({ message: `✅ Penalty #${id} marked as paid`, penalty });
  } catch (err) {
    console.error('❌ Error marking penalty as paid:', err);
    res.status(500).json({ error: 'Failed to update penalty status' });
  }
};

/**
 * Apply morning late penalty
 * @param {number} userId - ID of the student
 * @param {string} session - 'morning' or 'afternoon'
 */
export const applyPenalty = async (userId, session) => {
  if (session !== 'morning') return;

  const today = moment().tz('Asia/Manila').format('YYYY-MM-DD');

  const alreadyLateToday = await Attendance.findOne({
    where: { user_id: userId, date: today, session, status: 'late' }
  });

  if (!alreadyLateToday) return;

  const rules = await PenaltyRules.findAll();
  const lateRule = rules.find(r => r.condition.toLowerCase() === 'late');
  const penaltyAmount = lateRule ? parseFloat(lateRule.amount) : 5.00;

  const existingPenalty = await Penalties.findOne({
    where: { user_id: userId, reason: 'Late Arrival', status: 'unpaid' }
  });

  if (existingPenalty) {
    existingPenalty.amount = Number((existingPenalty.amount + penaltyAmount).toFixed(2));
    await existingPenalty.save();
  } else {
    await Penalties.create({
      user_id: userId,
      reason: 'Late Arrival',
      amount: Number(penaltyAmount.toFixed(2)),
      status: 'unpaid',
    });
  }
};

