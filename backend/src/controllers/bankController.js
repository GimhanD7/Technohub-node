const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function formatBankDetail(bank) {
  return {
    ...bank,
    is_active: !bank.is_hidden,
  };
}

function cleanBankPayload(body) {
  const bankName = String(body.bank_name || "").trim();
  const accountName = String(body.account_name || "").trim();
  const accountNumber = String(body.account_number || "").trim();
  const isHidden = body.is_hidden !== undefined
    ? Boolean(body.is_hidden)
    : body.is_active !== undefined
      ? !Boolean(body.is_active)
      : false;

  return { bankName, accountName, accountNumber, isHidden };
}

// Get all bank details for admin
exports.getAllBankDetails = async (req, res) => {
  try {
    const bankDetails = await prisma.bank_details.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, bankDetails: bankDetails.map(formatBankDetail) });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({ success: false, message: "Error fetching bank details" });
  }
};

// Get active bank details for students
exports.getActiveBankDetails = async (req, res) => {
  try {
    const bankDetails = await prisma.bank_details.findMany({
      where: { is_hidden: false },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, bankDetails: bankDetails.map(formatBankDetail) });
  } catch (error) {
    console.error("Error fetching active bank details:", error);
    res.status(500).json({ success: false, message: "Error fetching bank details" });
  }
};

// Add new bank details
exports.addBankDetails = async (req, res) => {
  try {
    const { bankName, accountName, accountNumber, isHidden } = cleanBankPayload(req.body);

    // Check if max limit reached
    const count = await prisma.bank_details.count();
    if (count >= 5) {
      return res.status(400).json({ success: false, message: "Maximum of 5 bank accounts allowed." });
    }

    if (!bankName || !accountName || !accountNumber) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newBank = await prisma.bank_details.create({
      data: {
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        is_hidden: isHidden
      }
    });

    res.json({ success: true, bankDetails: formatBankDetail(newBank), message: "Bank details added successfully" });
  } catch (error) {
    console.error("Error adding bank details:", error);
    res.status(500).json({ success: false, message: "Error adding bank details" });
  }
};

// Update bank details
exports.updateBankDetails = async (req, res) => {
  try {
    const { id } = req.body;
    const { bankName, accountName, accountNumber, isHidden } = cleanBankPayload(req.body);

    if (!id) return res.status(400).json({ success: false, message: "ID is required" });
    if (!bankName || !accountName || !accountNumber) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const updatedBank = await prisma.bank_details.update({
      where: { id: parseInt(id) },
      data: {
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        is_hidden: isHidden
      }
    });

    res.json({ success: true, bankDetails: formatBankDetail(updatedBank), message: "Bank details updated successfully" });
  } catch (error) {
    console.error("Error updating bank details:", error);
    res.status(500).json({ success: false, message: "Error updating bank details" });
  }
};

// Toggle status
exports.toggleStatus = async (req, res) => {
  try {
    const { id, status, is_hidden } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "ID is required" });
    const nextHidden = is_hidden !== undefined ? Boolean(is_hidden) : !Boolean(status);

    const updated = await prisma.bank_details.update({
      where: { id: parseInt(id) },
      data: { is_hidden: nextHidden }
    });

    res.json({ success: true, bankDetails: formatBankDetail(updated), message: "Status updated successfully" });
  } catch (error) {
    console.error("Error toggling bank details status:", error);
    res.status(500).json({ success: false, message: "Error toggling status" });
  }
};

// Delete bank details
exports.deleteBankDetails = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "ID is required" });

    await prisma.bank_details.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: "Bank details deleted successfully" });
  } catch (error) {
    console.error("Error deleting bank details:", error);
    res.status(500).json({ success: false, message: "Error deleting bank details" });
  }
};
