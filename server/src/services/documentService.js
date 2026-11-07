import fs from 'fs';
import path from 'path';
import { Document } from '../models/Document.js';
import { Project } from '../models/Project.js';
import { ActivityService } from './activityService.js';
import { logger } from '../utils/logger.js';

export class DocumentService {
  /**
   * Upload a new project document
   */
  static async uploadDocument({ collegeId, projectId, userId, file, body }) {
    if (!file) {
      const error = new Error('No file attached. Please select a valid document to upload.');
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    const title = (body.title || file.originalname).trim();
    const validCategories = [
      'PROPOSAL',
      'REQUIREMENTS',
      'DESIGN',
      'REPORT',
      'PRESENTATION',
      'FINAL_SUBMISSION',
      'OTHER'
    ];
    const category = validCategories.includes(body.category) ? body.category : 'OTHER';
    const status = body.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT';
    const fileUrl = `/uploads/documents/${file.filename}`;

    const initialVersion = {
      version: 1,
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
      notes: body.notes || 'Initial document upload'
    };

    const doc = await Document.create({
      collegeId,
      projectId,
      category,
      title,
      fileName: file.originalname,
      fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      version: 1,
      versions: [initialVersion],
      uploadedBy: userId,
      status
    });

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: doc._id,
      message: `uploaded ${category.toLowerCase().replace('_', ' ')}: "${title}" (v1)`
    });

    return await Document.findById(doc._id)
      .populate('uploadedBy', 'name email avatar')
      .populate('reviewedBy', 'name email avatar');
  }

  /**
   * List documents for a project with optional filters
   */
  static async listDocuments({ collegeId, projectId, query = {} }) {
    const filter = { collegeId, projectId };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status) {
      filter.status = query.status;
    }

    return await Document.find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email avatar')
      .populate('reviewedBy', 'name email avatar')
      .populate('versions.uploadedBy', 'name email avatar');
  }

  /**
   * Get single document by ID
   */
  static async getDocumentById({ collegeId, projectId, documentId }) {
    const doc = await Document.findOne({ _id: documentId, projectId, collegeId })
      .populate('uploadedBy', 'name email avatar')
      .populate('reviewedBy', 'name email avatar')
      .populate('versions.uploadedBy', 'name email avatar');

    if (!doc) {
      const error = new Error('Document not found in this project');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    return doc;
  }

  /**
   * Upload a new version of an existing document
   */
  static async uploadNewVersion({ collegeId, projectId, documentId, userId, file, body }) {
    if (!file) {
      const error = new Error('No file attached. Please select a file for the new version.');
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    const doc = await Document.findOne({ _id: documentId, projectId, collegeId });
    if (!doc) {
      const error = new Error('Document not found in this project');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const nextVersionNumber = doc.version + 1;
    const fileUrl = `/uploads/documents/${file.filename}`;

    const newVersionItem = {
      version: nextVersionNumber,
      fileUrl,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      uploadedAt: new Date(),
      notes: body.notes || `Version ${nextVersionNumber} revision`
    };

    doc.versions.push(newVersionItem);
    doc.version = nextVersionNumber;
    doc.fileUrl = fileUrl;
    doc.fileName = file.originalname;
    doc.mimeType = file.mimetype;
    doc.size = file.size;
    doc.uploadedBy = userId;

    // If changes were previously requested, auto-transition to SUBMITTED upon new version upload
    if (body.submitForReview === 'true' || body.submitForReview === true || doc.status === 'CHANGES_REQUESTED') {
      doc.status = 'SUBMITTED';
    }

    await doc.save();

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'DOCUMENT_VERSION_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: doc._id,
      message: `uploaded v${nextVersionNumber} for document: "${doc.title}"`
    });

    return await Document.findById(doc._id)
      .populate('uploadedBy', 'name email avatar')
      .populate('reviewedBy', 'name email avatar')
      .populate('versions.uploadedBy', 'name email avatar');
  }

  /**
   * Update document status (Submission or Faculty Review)
   */
  static async updateDocumentStatus({
    collegeId,
    projectId,
    documentId,
    userId,
    userRole,
    projectRole,
    isFacultyGuide,
    isProjectAdmin,
    body
  }) {
    const doc = await Document.findOne({ _id: documentId, projectId, collegeId });
    if (!doc) {
      const error = new Error('Document not found in this project');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const { status, reviewNotes } = body;
    const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED'];

    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    // Role validation
    if (status === 'APPROVED' || status === 'CHANGES_REQUESTED') {
      const canReview =
        isFacultyGuide ||
        isProjectAdmin ||
        userRole === 'FACULTY' ||
        userRole === 'COLLEGE_ADMIN' ||
        userRole === 'REVIEWER';

      if (!canReview) {
        const error = new Error('Only faculty guides, reviewers, or administrators can approve or request changes on documents.');
        error.statusCode = 403;
        error.status = 403;
        throw error;
      }

      doc.status = status;
      doc.reviewedBy = userId;
      doc.reviewedAt = new Date();
      doc.reviewNotes = reviewNotes || '';
    } else {
      // DRAFT or SUBMITTED by team member / leader
      doc.status = status;
    }

    await doc.save();

    const actionText =
      status === 'APPROVED'
        ? 'approved document'
        : status === 'CHANGES_REQUESTED'
        ? 'requested changes on document'
        : status === 'SUBMITTED'
        ? 'submitted document for faculty review'
        : 'marked document as draft';

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'DOCUMENT_STATUS_CHANGED',
      entityType: 'DOCUMENT',
      entityId: doc._id,
      message: `${actionText}: "${doc.title}"`
    });

    return await Document.findById(doc._id)
      .populate('uploadedBy', 'name email avatar')
      .populate('reviewedBy', 'name email avatar')
      .populate('versions.uploadedBy', 'name email avatar');
  }

  /**
   * Delete a document
   */
  static async deleteDocument({ collegeId, projectId, documentId, userId, projectRole, isProjectAdmin }) {
    const doc = await Document.findOne({ _id: documentId, projectId, collegeId });
    if (!doc) {
      const error = new Error('Document not found in this project');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    if (doc.status === 'APPROVED') {
      const error = new Error('Approved documents cannot be deleted.');
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    const isCreator = doc.uploadedBy.toString() === userId.toString();
    const isLeader = projectRole === 'LEADER' || isProjectAdmin;

    if (!isCreator && !isLeader) {
      const error = new Error('You do not have permission to delete this document.');
      error.statusCode = 403;
      error.status = 403;
      throw error;
    }

    // Attempt to remove local file best-effort
    try {
      if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), doc.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (cleanupErr) {
      logger.warn(`Could not delete file from disk: ${cleanupErr.message}`);
    }

    await Document.deleteOne({ _id: doc._id });

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'DOCUMENT_DELETED',
      entityType: 'DOCUMENT',
      entityId: doc._id,
      message: `deleted document: "${doc.title}"`
    });

    return { success: true };
  }
}

