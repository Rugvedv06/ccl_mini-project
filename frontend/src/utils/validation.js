import { FILE_TYPE_OPTIONS, MAX_FILE_SIZE_BYTES } from './constants';
import { extensionOf } from './format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values) {
  const errors = {};
  if (!values.email?.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.password) errors.password = 'Password is required.';
  else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  return errors;
}

export function validateAssignmentForm(values, { now = Date.now() } = {}) {
  const errors = {};
  if (!values.title?.trim()) errors.title = 'Title is required.';
  else if (values.title.trim().length < 3) errors.title = 'Title must be at least 3 characters.';
  else if (values.title.trim().length > 120) errors.title = 'Title must be 120 characters or fewer.';

  if (!values.description?.trim()) errors.description = 'Description is required.';
  else if (values.description.trim().length < 10)
    errors.description = 'Description must be at least 10 characters.';

  if (!values.dueDate) errors.dueDate = 'Deadline is required.';
  else if (Number.isNaN(new Date(values.dueDate).getTime())) errors.dueDate = 'Invalid date.';
  else if (new Date(values.dueDate).getTime() <= now)
    errors.dueDate = 'Deadline must be in the future.';

  const maxMarks = Number(values.maxMarks);
  if (values.maxMarks === '' || values.maxMarks === null || values.maxMarks === undefined)
    errors.maxMarks = 'Maximum marks are required.';
  else if (!Number.isFinite(maxMarks)) errors.maxMarks = 'Maximum marks must be a number.';
  else if (!Number.isInteger(maxMarks)) errors.maxMarks = 'Maximum marks must be a whole number.';
  else if (maxMarks <= 0) errors.maxMarks = 'Maximum marks must be greater than 0.';
  else if (maxMarks > 1000) errors.maxMarks = 'Maximum marks cannot exceed 1000.';

  if (!values.allowedFileTypes || values.allowedFileTypes.length === 0)
    errors.allowedFileTypes = 'Select at least one allowed file type.';

  return errors;
}

export function validateUploadSelection(file, allowedFileTypes = []) {
  const errors = {};
  if (!file) {
    errors.file = 'Choose a file to upload.';
    return errors;
  }
  const ext = extensionOf(file.name);
  if (!ext) errors.file = 'File must have an extension.';
  else if (allowedFileTypes.length && !allowedFileTypes.includes(ext))
    errors.file = `Files of type ".${ext}" are not accepted. Allowed: ${allowedFileTypes
      .map((t) => `.${t}`)
      .join(', ')}.`;
  if (file.size === 0) errors.file = 'The selected file is empty.';
  else if (file.size > MAX_FILE_SIZE_BYTES)
    errors.file = `File is too large (${Math.round(file.size / (1024 * 1024))} MB). Maximum is ${
      MAX_FILE_SIZE_BYTES / (1024 * 1024)
    } MB.`;
  return errors;
}

export function validateEvaluation(values, maxMarks) {
  const errors = {};
  const marks = Number(values.marks);
  if (values.marks === '' || values.marks === null || values.marks === undefined)
    errors.marks = 'Marks are required.';
  else if (!Number.isFinite(marks)) errors.marks = 'Marks must be a number.';
  else if (marks < 0) errors.marks = 'Marks cannot be negative.';
  else if (marks > maxMarks) errors.marks = `Marks cannot exceed the maximum of ${maxMarks}.`;

  if (!values.feedback?.trim()) errors.feedback = 'Feedback is required.';
  else if (values.feedback.trim().length > 2000)
    errors.feedback = 'Feedback must be 2000 characters or fewer.';
  return errors;
}

export function validateEvaluateStatus(status) {
  return ['SUBMITTED', 'EVALUATED'].includes(status)
    ? {}
    : { status: 'Only submitted work can be evaluated.' };
}

export function firstError(errors) {
  return Object.values(errors)[0];
}

export { FILE_TYPE_OPTIONS };
