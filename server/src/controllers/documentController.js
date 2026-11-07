import { DocumentService } from '../services/documentService.js';

export const uploadDocument = async (req, res, next) => {
  try {
    const document = await DocumentService.uploadDocument({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      userId: req.user._id,
      file: req.file,
      body: req.body
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const listDocuments = async (req, res, next) => {
  try {
    const documents = await DocumentService.listDocuments({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      query: req.query
    });

    res.status(200).json({
      success: true,
      message: 'Documents fetched successfully',
      data: { documents },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const document = await DocumentService.getDocumentById({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      documentId: req.params.documentId
    });

    res.status(200).json({
      success: true,
      message: 'Document fetched successfully',
      data: { document },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const uploadNewVersion = async (req, res, next) => {
  try {
    const document = await DocumentService.uploadNewVersion({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      documentId: req.params.documentId,
      userId: req.user._id,
      file: req.file,
      body: req.body
    });

    res.status(200).json({
      success: true,
      message: `Document updated to version ${document.version} successfully`,
      data: { document },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const updateDocumentStatus = async (req, res, next) => {
  try {
    const document = await DocumentService.updateDocumentStatus({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      documentId: req.params.documentId,
      userId: req.user._id,
      userRole: req.user.globalRole,
      projectRole: req.projectRole,
      isFacultyGuide: req.isFacultyGuide,
      isProjectAdmin: req.isProjectAdmin,
      body: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Document status updated successfully',
      data: { document },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    await DocumentService.deleteDocument({
      collegeId: req.collegeId,
      projectId: req.params.projectId,
      documentId: req.params.documentId,
      userId: req.user._id,
      projectRole: req.projectRole,
      isProjectAdmin: req.isProjectAdmin
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: null,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

