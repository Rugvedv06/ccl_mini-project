export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
};

export const FACULTY_GROUP = 'faculty';

export const ASSIGNMENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
};

export const SUBMISSION_STATUS = {
  PENDING_UPLOAD: 'PENDING_UPLOAD',
  SUBMITTED: 'SUBMITTED',
  EVALUATED: 'EVALUATED',
  EXPIRED: 'EXPIRED',
};

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const FILE_TYPE_OPTIONS = [
  { ext: 'pdf', mime: 'application/pdf' },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { ext: 'txt', mime: 'text/plain' },
  { ext: 'png', mime: 'image/png' },
  { ext: 'jpg', mime: 'image/jpeg' },
  { ext: 'jpeg', mime: 'image/jpeg' },
  { ext: 'zip', mime: 'application/zip' },
];
