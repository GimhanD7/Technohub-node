const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all bank details for admin
exports.getAllBankDetails = async (req, res) => {
  try {
    const bankDetails = await prisma.bank_details.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, bankDetails });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({ success: false, message: "Error fetching bank details" });
  }
};

// Get active bank details for students
exports.getActiveBankDetails = async (req, res) => {
  try {
    const bankDetails = await prisma.bank_details.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, bankDetails });
  } catch (error) {
    console.error("Error fetching active bank details:", error);
    res.status(500).json({ success: false, message: "Error fetching bank details" });
  }
};

// Add new bank details
exports.addBankDetails = async (req, res) => {
  try {
    const { bank_name, account_name, account_number, is_active } = req.body;

    // Check if max limit reached
    const count = await prisma.bank_details.count();
    if (count >= 5) {
      return res.status(400).json({ success: false, message: "Maximum of 5 bank accounts allowed." });
    }

    if (!bank_name || !account_name || !account_number) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newBank = await prisma.bank_details.create({
      data: {
        bank_name,
        account_name,
        account_number,
        is_active: is_active !== undefined ? is_active : true
      }
    });

    res.json({ success: true, bankDetails: newBank, message: "Bank details added successfully" });
  } catch (error) {
    console.error("Error adding bank details:", error);
    res.status(500).json({ success: false, message: "Error adding bank details" });
  }
};

// Update bank details
exports.updateBankDetails = async (req, res) => {
  try {
    const { id, bank_name, account_name, account_number, is_active } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "ID is required" });

    const updatedBank = await prisma.bank_details.update({
      where: { id: parseInt(id) },
      data: {
        bank_name,
        account_name,
        account_number,
        is_active
      }
    });

    res.json({ success: true, bankDetails: updatedBank, message: "Bank details updated successfully" });
  } catch (error) {
    console.error("Error updating bank details:", error);
    res.status(500).json({ success: false, message: "Error updating bank details" });
  }
};

// Toggle status
exports.toggleStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "ID is required" });

    const updated = await prisma.bank_details.update({
      where: { id: parseInt(id) },
      data: { is_active: status }
    });

    res.json({ success: true, bankDetails: updated, message: "Status updated successfully" });
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
