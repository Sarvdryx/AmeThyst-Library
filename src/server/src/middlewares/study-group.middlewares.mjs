const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const HAS_LETTER_PATTERN = /\p{L}/u;

const fail = (res, message, details) => res.status(400).json({
  success: false,
  error: { code: 'VALIDATION_ERROR', message, ...(details ? { details } : {}) },
});

const rejectUnknown = (value, allowed) => Object.keys(value || {}).filter((key) => !allowed.includes(key));

export const validateStudyGroupParams = (req, res, next) => {
  for (const key of ['groupId', 'requestId', 'userId']) {
    if (req.params[key] && !UUID_PATTERN.test(req.params[key])) return fail(res, `${key} must be a valid UUID.`);
  }
  next();
};

export const validatePagination = (req, res, next) => {
  const unknown = rejectUnknown(req.query, ['page', 'pageSize', 'search', 'subject', 'date', 'startTime', 'endTime', 'branchIds', 'roomIds', 'sort']);
  if (unknown.length) return fail(res, 'Unsupported query parameter.', { fields: unknown });
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const pageSize = req.query.pageSize === undefined ? 8 : Number(req.query.pageSize);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) return fail(res, 'Invalid pagination values.');
  if (req.query.search && String(req.query.search).length > 100) return fail(res, 'Search must be at most 100 characters.');
  if (req.query.subject && String(req.query.subject).length > 30) return fail(res, 'Subject must be at most 30 characters.');
  if (req.query.date && !DATE_PATTERN.test(String(req.query.date))) return fail(res, 'date must use YYYY-MM-DD.');
  for (const key of ['startTime', 'endTime']) {
    if (req.query[key] && !TIME_PATTERN.test(String(req.query[key]))) return fail(res, `${key} must use HH:mm.`);
  }
  if (req.query.startTime && req.query.endTime && req.query.startTime >= req.query.endTime) return fail(res, 'startTime must be earlier than endTime.');
  const normalizedQuery = { ...req.query, page, pageSize };
  for (const key of ['branchIds', 'roomIds']) {
    if (req.query[key] === undefined || req.query[key] === '') { normalizedQuery[key] = []; continue; }
    const values = String(req.query[key]).split(',').map(Number);
    if (!values.length || values.some((value) => !Number.isInteger(value) || value < 1)) return fail(res, `${key} must be a comma-separated list of positive integers.`);
    normalizedQuery[key] = [...new Set(values)];
  }
  if (req.query.sort && !['newest', 'availability'].includes(req.query.sort)) return fail(res, 'Unsupported sort value.');
  req.studyGroupQuery = normalizedQuery;
  next();
};

const sanitizeMetadata = (body, partial = false, extraAllowed = []) => {
  const allowed = ['title', 'description', 'subject', 'requirements', ...extraAllowed];
  const unknown = rejectUnknown(body, allowed);
  if (unknown.length) return { error: 'Unsupported request field.', details: { fields: unknown } };
  if (partial && !allowed.some((key) => body[key] !== undefined)) return { error: 'At least one editable field is required.' };
  for (const key of ['title', 'description', 'subject']) {
    if (!partial || body[key] !== undefined) {
      if (typeof body[key] !== 'string' || !body[key].trim()) return { error: `${key} is required.` };
      body[key] = body[key].trim();
    }
  }
  if (body.title && !HAS_LETTER_PATTERN.test(body.title)) return { error: 'title must contain at least one letter.' };
  if (body.subject && !HAS_LETTER_PATTERN.test(body.subject)) return { error: 'subject must contain at least one letter.' };
  if (body.title && body.title.length > 200) return { error: 'title must be at most 200 characters.' };
  if (body.subject && body.subject.length > 30) return { error: 'subject must be at most 30 characters.' };
  if (!partial || body.requirements !== undefined) {
    if (body.requirements === undefined && !partial) body.requirements = [];
    if (!Array.isArray(body.requirements)) return { error: 'requirements must be an array.' };
    body.requirements = body.requirements.map((item) => String(item).trim()).filter(Boolean);
    if (body.requirements.length > 5) return { error: 'requirements must contain at most five non-empty items.' };
  }
  return {};
};

export const validateCreateStudyGroup = (req, res, next) => {
  const unknown = rejectUnknown(req.body, ['availId', 'startDate', 'title', 'description', 'subject', 'requirements']);
  if (unknown.length) return fail(res, 'Unsupported request field.', { fields: unknown });
  const availId = Number(req.body.availId);
  if (!Number.isInteger(availId) || availId < 1) return fail(res, 'availId must be a positive integer.');
  if (typeof req.body.startDate !== 'string' || !DATE_PATTERN.test(req.body.startDate)) return fail(res, 'startDate must use YYYY-MM-DD.');
  req.body.availId = availId;
  const result = sanitizeMetadata(req.body, false, ['availId', 'startDate']);
  if (result.error) return fail(res, result.error, result.details);
  next();
};

export const validateUpdateStudyGroup = (req, res, next) => {
  const result = sanitizeMetadata(req.body, true);
  if (result.error) return fail(res, result.error, result.details);
  next();
};

export const validateJoinRequest = (req, res, next) => {
  const unknown = rejectUnknown(req.body, ['content']);
  if (unknown.length) return fail(res, 'Unsupported request field.', { fields: unknown });
  if (req.body.content !== undefined && req.body.content !== null) {
    if (typeof req.body.content !== 'string' || req.body.content.trim().length > 100) return fail(res, 'content must be at most 100 characters.');
    req.body.content = req.body.content.trim() || null;
  }
  next();
};

export const validateInvitation = (req, res, next) => {
  const unknown = rejectUnknown(req.body, ['email', 'message']);
  if (unknown.length) return fail(res, 'Unsupported request field.', { fields: unknown });
  const email = String(req.body?.email || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 'A valid email address is required.');
  if (req.body?.message && String(req.body.message).length > 100) return fail(res, 'Message must be at most 100 characters.');
  req.body = { email, message: String(req.body?.message || '').trim() || undefined };
  next();
};
