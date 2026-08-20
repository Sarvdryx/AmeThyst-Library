import { getEmailConfiguration } from '../config/env.mjs';

const emailConfiguration = getEmailConfiguration();
const fromAddress = `"AmeThyst Library" <${emailConfiguration.from}>`;

const transporter = {
  sendMail: async (options) => {
    const recipients = typeof options.to === 'string' ? [options.to] : options.to;
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': emailConfiguration.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: emailConfiguration.from, name: 'AmeThyst Library' },
        to: recipients.map((email) => ({ email })),
        subject: options.subject,
        htmlContent: options.html,
        ...(options.headers ? { headers: options.headers } : {}),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error: ${response.status} ${errorBody}`);
    }
  },
};

const sendOTPEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: 'Your OTP Code for Password Reset',
    html: `
      <h2>Hello!</h2>
      <p>Your OTP code is:</p>
      <h1 style="color: #7c3aed; letter-spacing: 8px;">${otp}</h1>
      <p>This code is valid for <b>5 minutes</b>.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  });
};

const sendVerificationEmail = async (toEmail, token) => {
  const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;


  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: 'Verify your AmeThyst Library account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #0B1C30; margin-bottom: 8px;">Welcome to AmeThyst Library!</h2>
        <p style="color: #45474C; margin-bottom: 24px;">
          Thanks for signing up. Please verify your email address to activate your account.
          This link will expire in <b>5 minutes</b>.
        </p>
        <p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 32px; background-color: #0A3240; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Verify Email
          </a>
        </p>
        <p style="color: #A1A3A7; font-size: 12px; margin-top: 24px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const studyGroupActor = (actor = {}) => {
  const username = escapeHtml(actor.username || 'Unknown');
  const email = escapeHtml(actor.email || 'Unknown');
  const avatar = actor.avatar
    ? `<img src="${escapeHtml(actor.avatar)}" alt="" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:50%;object-fit:cover;border:1px solid #D8D1C8;" />`
    : `<span style="display:flex;width:44px;height:44px;border-radius:50%;align-items:center;justify-content:center;background:#486C7E;color:#fff;font-size:16px;font-weight:700;">${escapeHtml((actor.username || '?').trim().charAt(0).toUpperCase())}</span>`;
  return `
    <div style="margin:20px 0;padding:14px 16px;border:1px solid #DED7CE;border-radius:12px;background:#FFFDF9;">
      <p style="margin:0 0 10px;color:#486C7E;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">Performed by · Người thực hiện</p>
      <div style="display:flex;align-items:center;gap:12px;">
        ${avatar}
        <div style="min-width:0;margin-left:14px;">
          <strong style="display:block;color:#0B1C30;font-size:14px;">${username}</strong>
          <span style="display:block;margin-top:3px;color:#686C71;font-size:12px;overflow-wrap:anywhere;">${email}</span>
        </div>
      </div>
    </div>`;
};

const studyGroupEventBanner = ({ icon, eyebrow, title, summary, accent, surface }) => `
  <div style="margin:0;padding:24px;border-radius:16px;background:${surface};border:1px solid ${accent};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td width="56" valign="top">
          <div style="width:48px;height:48px;line-height:48px;border-radius:50%;background:${accent};color:#FFFFFF;text-align:center;font-size:23px;font-weight:700;">${icon}</div>
        </td>
        <td valign="middle" style="padding-left:14px;">
          <p style="margin:0 0 5px;color:${accent};font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">${eyebrow}</p>
          <h1 style="margin:0;color:#0B1C30;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;">${title}</h1>
        </td>
      </tr>
    </table>
    <p style="margin:18px 0 0;color:#3F464D;font-size:15px;line-height:1.65;">${summary}</p>
  </div>`;

const studyGroupEmailShell = ({ preheader, banner, body }) => `
  <div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preheader}</div>
  <div style="margin:0;background:#F3EEE8;padding:24px 12px;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;border:1px solid #DED7CE;border-radius:20px;background:#FFFDF9;color:#0B1C30;overflow:hidden;">
      <div style="padding:18px 28px;border-bottom:1px solid #E7E0D8;background:#0A3240;color:#FFFFFF;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">
        AmeThyst Library <span style="color:#A9C3CD;">/ Study Group</span>
      </div>
      <div style="padding:28px;">
        ${banner}
        ${body}
      </div>
      <div style="padding:18px 28px;background:#F6F1EB;color:#777B80;font-size:11px;line-height:1.6;text-align:center;">
        AmeThyst Library Study Group notification · Thông báo Nhóm học từ Thư viện AmeThyst
      </div>
    </div>
  </div>`;

const sendStudyGroupInvitationEmail = async (toEmail, invitation) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const invitationUrl = `${baseUrl}/dashboard/user/yourstudygroups?invitation=${encodeURIComponent(invitation.requestId)}`;
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[INVITATION · LỜI MỜI] ${invitation.hostName} invited you to ${invitation.title}`,
    headers: {
      'X-Entity-Ref-ID': invitation.requestId,
    },
    html: studyGroupEmailShell({
      preheader: `${escapeHtml(invitation.hostName)} invited you to join ${escapeHtml(invitation.title)}.`,
      banner: studyGroupEventBanner({
        icon: '✉',
        eyebrow: 'Invitation · Lời mời tham gia',
        title: 'You are invited',
        summary: `<strong>${escapeHtml(invitation.hostName)}</strong> invited you to join <strong>${escapeHtml(invitation.title)}</strong>.<br/><span style="color:#667078;">Bạn được mời tham gia nhóm học này và cần phản hồi.</span>`,
        accent: '#315A6B',
        surface: '#EAF2F4',
      }),
      body: `
        ${studyGroupActor(invitation.actor)}
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">Invitation ${escapeHtml(invitation.requestId)}</span>
        ${studyGroupSchedule(invitation)}
        <div style="margin:24px 0 0;text-align:center;">
          <a href="${invitationUrl}" style="display:inline-block;margin:0 5px 10px;padding:12px 24px;background:#0A3240;color:#FFFFFF;border-radius:9px;text-decoration:none;font-weight:800;">Review invitation · Xem lời mời</a>
        </div>
        <p style="margin:12px 0 0;color:#7A7F84;font-size:12px;line-height:1.65;text-align:center;">Sign in with this email address to respond.<br/>Đăng nhập bằng địa chỉ email này để phản hồi.</p>`,
    }),
  });
};

const studyGroupSchedule = (group) => `
  <div style="margin:20px 0 0;border:1px solid #DED7CE;border-radius:14px;overflow:hidden;">
    <div style="padding:14px 16px;background:#F6F1EB;border-bottom:1px solid #DED7CE;">
      <p style="margin:0 0 3px;color:#777B80;font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;">Study Group · Nhóm học</p>
      <strong style="display:block;color:#0B1C30;font-size:17px;line-height:1.4;">${escapeHtml(group.title)}</strong>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;line-height:1.55;">
      <tr>
        <td width="34%" style="padding:12px 16px;color:#72777C;border-bottom:1px solid #EEE8E1;">Subject · Môn học</td>
        <td style="padding:12px 16px;color:#172536;font-weight:700;border-bottom:1px solid #EEE8E1;">${escapeHtml(group.subject)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#72777C;border-bottom:1px solid #EEE8E1;">Date &amp; time · Lịch</td>
        <td style="padding:12px 16px;color:#172536;font-weight:700;border-bottom:1px solid #EEE8E1;">${escapeHtml(group.date)} · ${escapeHtml(group.time)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;color:#72777C;">Location · Địa điểm</td>
        <td style="padding:12px 16px;color:#172536;font-weight:700;">${escapeHtml(group.roomName)} · ${escapeHtml(group.branchName)}</td>
      </tr>
    </table>
  </div>`;

const studyGroupCta = (href, label) => `
  <div style="margin:24px 0 0;text-align:center;">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;background:#0A3240;color:#FFFFFF;border-radius:9px;text-decoration:none;font-weight:800;">${label}</a>
  </div>`;

const studyGroupDestination = (group, mode = 'dashboard') => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  if (mode === 'created') return `${baseUrl}/dashboard/user/yourstudygroups/created/${encodeURIComponent(group.groupId)}`;
  if (mode === 'joined') return `${baseUrl}/dashboard/user/yourstudygroups/joined/${encodeURIComponent(group.groupId)}`;
  return `${baseUrl}/dashboard/user/yourstudygroups`;
};

const sendStudyGroupRequestSubmittedEmail = async (toEmail, group) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[JOIN REQUEST · YÊU CẦU THAM GIA] ${group.actor.username} requested to join ${group.title}`,
    html: studyGroupEmailShell({
      preheader: `${escapeHtml(group.actor.username)} requested to join ${escapeHtml(group.title)}.`,
      banner: studyGroupEventBanner({
        icon: '?',
        eyebrow: 'Join request · Yêu cầu tham gia',
        title: 'A student wants to join',
        summary: `<strong>${escapeHtml(group.actor.username)}</strong> sent a request to join your Study Group.<br/><span style="color:#596C75;">Một sinh viên đang chờ bạn xem xét yêu cầu tham gia.</span>`,
        accent: '#486C7E',
        surface: '#EAF1F3',
      }),
      body: `${studyGroupActor(group.actor)}${studyGroupSchedule(group)}${studyGroupCta(studyGroupDestination(group, 'created'), 'Review request · Xem yêu cầu')}`,
    }),
  });
};

const sendStudyGroupRequestApprovedEmail = async (toEmail, group) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[APPROVED · ĐÃ ĐỒNG Ý] You joined ${group.title}`,
    html: studyGroupEmailShell({
      preheader: `Your request to join ${escapeHtml(group.title)} was approved.`,
      banner: studyGroupEventBanner({
        icon: '✓',
        eyebrow: 'Request approved · Yêu cầu được chấp nhận',
        title: 'You are now a member',
        summary: 'The creator approved your request to join this Study Group.<br/><span style="color:#4E685D;">Yêu cầu của bạn đã được chấp nhận.</span>',
        accent: '#3F725B',
        surface: '#EAF4EE',
      }),
      body: `${studyGroupActor(group.actor)}${studyGroupSchedule(group)}${studyGroupCta(studyGroupDestination(group, 'joined'), 'View joined group · Xem nhóm đã tham gia')}`,
    }),
  });
};

const sendStudyGroupRequestDeniedEmail = async (toEmail, group) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[DECLINED · ĐÃ TỪ CHỐI] Your request for ${group.title}`,
    html: studyGroupEmailShell({
      preheader: `Your request to join ${escapeHtml(group.title)} was declined.`,
      banner: studyGroupEventBanner({
        icon: '×',
        eyebrow: 'Request declined · Yêu cầu bị từ chối',
        title: 'Your request was declined',
        summary: `The creator declined your request. You may request again after the 30-minute cooldown.<br/><span style="color:#6F5A52;">Bạn có thể gửi lại yêu cầu sau thời gian chờ 30 phút.</span>`,
        accent: '#9A4935',
        surface: '#F9E9E3',
      }),
      body: `${studyGroupActor(group.actor)}${studyGroupSchedule(group)}${studyGroupCta(studyGroupDestination(group), 'View your Study Groups · Xem các nhóm học của bạn')}`,
    }),
  });
};

const sendStudyGroupMemberJoinedEmail = async (toEmail, group) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[MEMBER JOINED · THÀNH VIÊN MỚI] ${group.actor.username} joined ${group.title}`,
    html: studyGroupEmailShell({
      preheader: `${escapeHtml(group.actor.username)} joined ${escapeHtml(group.title)}. Members: ${escapeHtml(group.currentMembers)}/${escapeHtml(group.capacity)}.`,
      banner: studyGroupEventBanner({
        icon: '+',
        eyebrow: 'Member joined · Thành viên mới',
        title: 'Your group has a new member',
        summary: `<strong>${escapeHtml(group.actor.username)}</strong> joined your Study Group.<br/><span style="color:#4E685D;">Members · Thành viên: <strong>${escapeHtml(group.currentMembers)}/${escapeHtml(group.capacity)}</strong></span>`,
        accent: '#3F725B',
        surface: '#EAF4EE',
      }),
      body: `${studyGroupActor(group.actor)}${studyGroupSchedule(group)}${studyGroupCta(studyGroupDestination(group, 'created'), 'View group · Xem nhóm học')}`,
    }),
  });
};

const sendStudyGroupRemovalEmail = async (toEmail, group) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[MEMBER REMOVED · ĐÃ XÓA] You were removed from ${group.title}`,
    html: studyGroupEmailShell({
      preheader: `Your membership in ${escapeHtml(group.title)} has ended.`,
      banner: studyGroupEventBanner({
        icon: '−',
        eyebrow: 'Member removed · Đã xóa thành viên',
        title: 'Your membership has ended',
        summary: 'The organizer removed you from this Study Group.<br/><span style="color:#6F5A52;">Người tổ chức đã xóa bạn khỏi nhóm học này.</span>',
        accent: '#9A4935',
        surface: '#F9E9E3',
      }),
      body: `
        ${studyGroupActor(group.actor)}
        ${studyGroupSchedule(group)}
        <p style="margin:20px 0 0;padding:13px 15px;border-left:4px solid #9A4935;background:#FBF3EF;color:#65564F;font-size:12px;line-height:1.65;">You are no longer counted as a member. No action is required.<br/>Bạn không còn được tính là thành viên và không cần thực hiện thao tác nào.</p>
        ${studyGroupCta(studyGroupDestination(group), 'View your Study Groups · Xem các nhóm học của bạn')}`,
    }),
  });
};

const sendStudyGroupMemberLeftEmail = async (toEmail, group) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[MEMBER LEFT · ĐÃ RỜI NHÓM] ${group.memberName} left ${group.title}`,
    html: studyGroupEmailShell({
      preheader: `${escapeHtml(group.memberName)} left ${escapeHtml(group.title)}; one place is now available.`,
      banner: studyGroupEventBanner({
        icon: '↗',
        eyebrow: 'Member left · Thành viên rời nhóm',
        title: 'A place is now available',
        summary: `<strong>${escapeHtml(group.memberName)}</strong> voluntarily left your Study Group.<br/><span style="color:#596C75;">Một thành viên đã rời nhóm và vị trí của họ đã được mở lại.</span>`,
        accent: '#486C7E',
        surface: '#EAF1F3',
      }),
      body: `
        ${studyGroupActor(group.actor)}
        ${studyGroupSchedule(group)}
        <p style="margin:20px 0 0;padding:13px 15px;border-left:4px solid #486C7E;background:#F0F5F6;color:#53636B;font-size:12px;line-height:1.65;">Their place is now available to another student. No action is required.<br/>Vị trí này hiện có thể dành cho một sinh viên khác.</p>
        ${studyGroupCta(studyGroupDestination(group, 'created'), 'View group · Xem nhóm học')}`,
    }),
  });
};

const sendStudyGroupDissolvedEmail = async (toEmail, group) => {
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: `[CANCELLED · ĐÃ HỦY] ${group.title} is no longer available`,
    html: studyGroupEmailShell({
      preheader: `${escapeHtml(group.title)} and its room reservation have been cancelled.`,
      banner: studyGroupEventBanner({
        icon: '!',
        eyebrow: 'Cancelled · Đã hủy',
        title: 'This session is cancelled',
        summary: 'The organizer dissolved this Study Group and cancelled its room reservation.<br/><span style="color:#79534F;">Nhóm học và lượt đặt phòng liên quan đã bị hủy.</span>',
        accent: '#B3261E',
        surface: '#FBE9E7',
      }),
      body: `
        ${studyGroupActor(group.actor)}
        ${studyGroupSchedule(group)}
        <p style="margin:20px 0 0;padding:13px 15px;border-left:4px solid #B3261E;background:#FCF0EF;color:#704B47;font-size:12px;line-height:1.65;"><strong>Please remove this session from your plans.</strong> No response is required.<br/><strong>Vui lòng loại buổi học này khỏi kế hoạch của bạn.</strong> Bạn không cần phản hồi.</p>
        ${studyGroupCta(studyGroupDestination(group), 'View your Study Groups · Xem các nhóm học của bạn')}`,
    }),
  });
};

const sendAdminInviteEmail = async (toEmail, tempPassword) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: 'You are invited as an AmeThyst Library Administrator',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #0B1C30; margin-bottom: 8px;">Welcome to AmeThyst Library!</h2>
        <p style="color: #45474C; margin-bottom: 24px;">
          You have been invited to join the library as an <b>administrator</b>.
          Sign in with the temporary password below and you will be asked to set your own password.
        </p>
        <div style="background: #F3F4F6; border: 1px dashed #9CA3AF; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="color: #6B7280; font-size: 12px; margin: 0 0 6px;">Your temporary password</p>
          <p style="color: #0B1C30; font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700; letter-spacing: 2px; margin: 0;">${escapeHtml(tempPassword)}</p>
        </div>
        <p>
          <a href="${baseUrl}/login" style="display: inline-block; padding: 12px 32px; background-color: #0A3240; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Sign In
          </a>
        </p>
        <p style="color: #A1A3A7; font-size: 12px; margin-top: 24px;">
          For security, change this password immediately after your first sign in.
        </p>
      </div>
    `,
  });
};

export {
  sendOTPEmail,
  sendVerificationEmail,
  sendAdminInviteEmail,
  sendStudyGroupInvitationEmail,
  sendStudyGroupRemovalEmail,
  sendStudyGroupMemberLeftEmail,
  sendStudyGroupDissolvedEmail,
  sendStudyGroupRequestSubmittedEmail,
  sendStudyGroupRequestApprovedEmail,
  sendStudyGroupRequestDeniedEmail,
  sendStudyGroupMemberJoinedEmail,
};
