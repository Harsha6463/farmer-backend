import User from '../models/User.js';
import { sendEmail, emailTemplates } from './emailService.js';

const notifyUser = async (userId, type, data) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    switch (type) {
      case 'welcome':
        await sendEmail(
          user.email,
          ...Object.values(emailTemplates.welcomeEmail(user.firstName))
        );
        break;

      case 'loan_request':
        await sendEmail(
          user.email,
          ...Object.values(emailTemplates.loanRequestNotification(data.farmName, data.amount))
        );
        break;

      case 'investment':
        await sendEmail(
          user.email,
          ...Object.values(emailTemplates.investmentConfirmation(data.farmName, data.amount))
        );
        break;

      case 'repayment_reminder':
        await sendEmail(
          user.email,
          ...Object.values(emailTemplates.repaymentReminder(data.amount, data.dueDate))
        );
        break;
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
};

export { notifyUser };
