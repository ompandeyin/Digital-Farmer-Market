import nodemailer from 'nodemailer';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send welcome email
export const sendWelcomeEmail = async (email, name) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Welcome to Farm2Home, ${name}!</h2>
      <p>Thank you for joining our community of fresh produce lovers and sustainable farmers.</p>
      <p>You can now:</p>
      <ul>
        <li>Browse fresh produce from local farmers</li>
        <li>Participate in live auctions</li>
        <li>Make direct purchases from verified farmers</li>
      </ul>
      <p style="margin-top: 20px;">Happy shopping!</p>
      <p style="color: #666; font-size: 12px;">Farm2Home Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: 'Welcome to Farm2Home!',
    html: htmlContent
  });
};

// Send order confirmation email
export const sendOrderConfirmation = async (email, orderData) => {
  const itemsHtml = orderData.items
    .map(
      item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity} ${item.unit}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${item.price}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Order Confirmed!</h2>
      <p>Thank you for your purchase. Order #${orderData.orderNumber}</p>
      
      <table style="width: 100%; margin: 20px 0;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px; text-align: left;">Product</th>
          <th style="padding: 10px; text-align: left;">Quantity</th>
          <th style="padding: 10px; text-align: left;">Price</th>
        </tr>
        ${itemsHtml}
      </table>
      
      <p style="font-size: 16px; margin-top: 20px;"><strong>Total: ₹${orderData.totalAmount}</strong></p>
      <p>Your order will be delivered soon!</p>
      <p style="color: #666; font-size: 12px;">Farm2Home Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html: htmlContent
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; background: #22c55e; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Reset Password
      </a>
      
      <p>This link expires in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: 'Reset Your Farm2Home Password',
    html: htmlContent
  });
};

// Send auction notification
export const sendAuctionNotification = async (email, auctionData) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">You've Won the Auction!</h2>
      <p>Congratulations! You've won the auction for <strong>${auctionData.productName}</strong></p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Winning Bid:</strong> ₹${auctionData.winningBidAmount}</p>
        <p><strong>Quantity:</strong> ${auctionData.quantity} ${auctionData.unit}</p>
        <p><strong>Farmer:</strong> ${auctionData.farmerName}</p>
      </div>
      
      <p>The farmer will contact you shortly to arrange delivery.</p>
      <p style="color: #666; font-size: 12px;">Farm2Home Team</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    to: email,
    subject: `Auction Won - ${auctionData.productName}`,
    html: htmlContent
  });
};
