const { Campaign, CampaignContact, CampaignLog, User } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all campaigns for user
 */
exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Campaign.findAndCountAll({
      where,
      include: [{ association: 'contacts' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Get campaigns failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

/**
 * Get campaign by ID
 */
exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: { id, user_id: req.user.id },
      include: [{ association: 'contacts' }, { association: 'logs' }],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    logger.error('Get campaign failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
};

/**
 * Create new campaign
 */
exports.createCampaign = async (req, res) => {
  try {
    const { name, description, message_content, template_id, campaign_type } = req.body;

    const campaign = await Campaign.create({
      user_id: req.user.id,
      name,
      description,
      message_content,
      template_id,
      campaign_type,
      status: 'DRAFT',
    });

    logger.info(`Campaign created: ${campaign.id}`, { userId: req.user.id });

    res.status(201).json(campaign);
  } catch (error) {
    logger.error('Create campaign failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

/**
 * Update campaign
 */
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const campaign = await Campaign.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Prevent updates to running/completed campaigns
    if (['RUNNING', 'COMPLETED', 'CANCELLED'].includes(campaign.status)) {
      return res.status(403).json({ error: 'Cannot update campaign in this status' });
    }

    await campaign.update(updates);

    logger.info(`Campaign updated: ${campaign.id}`, { userId: req.user.id });

    res.json(campaign);
  } catch (error) {
    logger.error('Update campaign failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

/**
 * Delete campaign
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'RUNNING') {
      return res.status(403).json({ error: 'Cannot delete running campaign' });
    }

    await campaign.destroy();

    logger.info(`Campaign deleted: ${campaign.id}`, { userId: req.user.id });

    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    logger.error('Delete campaign failed', { error: error.message });
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

/**
 * Send campaign (bulk queue messages)
 */
exports.sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: { id, user_id: req.user.id },
      include: [{ association: 'contacts' }],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'PAUSED') {
      return res.status(400).json({ error: 'Campaign is already running or completed' });
    }

    // Update campaign status
    campaign.status = 'RUNNING';
    campaign.started_at = new Date();
    await campaign.save();

    logger.info(`Campaign started: ${campaign.id}`, {
      userId: req.user.id,
      totalContacts: campaign.total_contacts,
    });

    res.json({
      message: 'Campaign started',
      campaign_id: campaign.id,
      messages_queued: result.jobsCreated,
      total_contacts: result.totalContacts,
    });
  } catch (error) {
    logger.error('Send campaign failed', { error: error.message });
    res.status(500).json({ error: 'Failed to send campaign' });
  }
};

/**
 * Get campaign report/statistics
 */
exports.getCampaignReport = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const logs = await CampaignLog.findAll({
      where: { campaign_id: id },
    });

    const report = {
      campaign: campaign,
      stats: {
        total: campaign.total_contacts,
        sent: campaign.sent_count,
        failed: campaign.failed_count,
        pending: campaign.pending_count,
        success_rate: ((campaign.sent_count / campaign.total_contacts) * 100).toFixed(2),
      },
      logs: logs,
    };

    res.json(report);
  } catch (error) {
    logger.error('Get campaign report failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

/**
 * Pause campaign
 */
exports.pauseCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'RUNNING') {
      return res.status(400).json({ error: 'Only running campaigns can be paused' });
    }

    campaign.status = 'PAUSED';
    await campaign.save();

    logger.info(`Campaign paused: ${campaign.id}`, { userId: req.user.id });

    res.json({ message: 'Campaign paused' });
  } catch (error) {
    logger.error('Pause campaign failed', { error: error.message });
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
};

/**
 * Add contacts to campaign
 */
exports.addContacts = async (req, res) => {
  try {
    const { id } = req.params;
    const { contacts } = req.body;

    const campaign = await Campaign.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Add contacts to campaign
    const contactsToAdd = contacts.map((contact) => ({
      campaign_id: id,
      phone_number: contact.phone_number || contact,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
    }));

    await CampaignContact.bulkCreate(contactsToAdd);

    // Update campaign total_contacts and pending_count
    campaign.total_contacts = (campaign.total_contacts || 0) + contacts.length;
    campaign.pending_count = campaign.total_contacts;
    await campaign.save();

    logger.info(`Added ${contacts.length} contacts to campaign ${id}`, {
      userId: req.user.id,
    });

    res.status(201).json({
      message: `Added ${contacts.length} contacts`,
      total_contacts: campaign.total_contacts,
    });
  } catch (error) {
    logger.error('Add contacts failed', { error: error.message });
    res.status(500).json({ error: 'Failed to add contacts' });
  }
};
