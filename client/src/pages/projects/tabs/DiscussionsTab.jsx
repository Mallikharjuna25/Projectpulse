import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Trash2,
  Megaphone,
  Pin,
  Plus,
  X,
  Clock,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { commentApi } from '../../../services/commentApi.js';
import { announcementApi } from '../../../services/announcementApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useSocket } from '../../../context/SocketContext.jsx';
import toast from 'react-hot-toast';

export const DiscussionsTab = ({ projectId, project, teamMembers = [], isLeader }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Comments state
  const [comments, setComments] = useState([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);

  const canPostAnnouncement =
    isLeader ||
    ['FACULTY', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].includes(user?.globalRole);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await commentApi.listComments(projectId, {
        entityType: 'DISCUSSION',
        entityId: projectId
      });
      setComments(res?.data?.comments || res?.comments || []);
    } catch {
      toast.error('Failed to load project discussions');
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementApi.listAnnouncements({ projectId });
      setAnnouncements(res?.data?.announcements || res?.announcements || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchComments();
    fetchAnnouncements();
  }, [projectId]);

  // Real-time Socket.IO sync for new comments & announcements
  useEffect(() => {
    if (socket && projectId) {
      const handleNewComment = (comment) => {
        setComments((prev) => {
          if (prev.some((c) => c._id === comment._id)) return prev;
          return [...prev, comment];
        });
      };

      const handleNewAnnouncement = (announcement) => {
        setAnnouncements((prev) => {
          if (prev.some((a) => a._id === announcement._id)) return prev;
          return [announcement, ...prev];
        });
      };

      socket.on('comment:new', handleNewComment);
      socket.on('announcement:new', handleNewAnnouncement);

      return () => {
        socket.off('comment:new', handleNewComment);
        socket.off('announcement:new', handleNewAnnouncement);
      };
    }
  }, [socket, projectId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await commentApi.createComment(projectId, {
        entityType: 'DISCUSSION',
        entityId: projectId,
        body: newCommentBody.trim()
      });

      setComments((prev) => {
        if (prev.some((c) => c._id === res.data.comment._id)) return prev;
        return [...prev, res.data.comment];
      });
      setNewCommentBody('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePostReply = async (parentId) => {
    if (!replyBody.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await commentApi.createComment(projectId, {
        entityType: 'DISCUSSION',
        entityId: projectId,
        body: replyBody.trim(),
        parentId
      });

      setComments((prev) => {
        if (prev.some((c) => c._id === res.data.comment._id)) return prev;
        return [...prev, res.data.comment];
      });
      setReplyingToId(null);
      setReplyBody('');
      toast.success('Reply posted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentApi.deleteComment(projectId, commentId);
      setComments((prev) =>
        prev.filter((c) => c._id !== commentId && c.parentId !== commentId)
      );
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) return;

    try {
      setSubmittingAnnouncement(true);
      const res = await announcementApi.createAnnouncement({
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        projectId,
        pinned: announcementPinned
      });

      setAnnouncements((prev) => [res.data.announcement, ...prev]);
      setShowAnnouncementModal(false);
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setAnnouncementPinned(false);
      toast.success('Announcement published');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      const res = await announcementApi.togglePin(id);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? res.data.announcement : a))
      );
      toast.success('Pin toggled');
    } catch {
      toast.error('Failed to toggle pin');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.success('Announcement removed');
    } catch {
      toast.error('Failed to remove announcement');
    }
  };

  // Group comments into root comments and their replies
  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId) =>
    comments.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Announcements Banner Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-500" />
            Project & Institutional Announcements
          </h2>
          {canPostAnnouncement && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Post Announcement
            </button>
          )}
        </div>

        {announcements.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No announcements posted for this project yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.map((a) => (
              <div
                key={a._id}
                className={`p-4 rounded-xl border relative transition-all ${
                  a.pinned
                    ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-700/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {a.title}
                    </h3>
                  </div>

                  {canPostAnnouncement && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTogglePin(a._id)}
                        className={`p-1 rounded text-slate-400 hover:text-amber-500 ${
                          a.pinned ? 'text-amber-500' : ''
                        }`}
                        title={a.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(a._id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
                  {a.body}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>By {a.authorId?.name || 'Administrator'}</span>
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discussion Stream */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Team Discussions & Mentions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Discuss project decisions, ask questions, and mention teammates with <span className="font-mono text-indigo-500">@name</span> for instant alerts.
          </p>
        </div>

        {/* New Root Comment Box */}
        <form onSubmit={handlePostComment} className="space-y-3">
          <div className="relative">
            <textarea
              rows="3"
              required
              placeholder="Start a project discussion or ask a question... (Type @name to mention a teammate)"
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              className="w-full text-xs px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Quick Mention Pills */}
          {teamMembers.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400">
              <span className="shrink-0 font-medium">Quick mention:</span>
              {teamMembers.map((m) => (
                <button
                  type="button"
                  key={m.userId?._id || m._id}
                  onClick={() => {
                    const handle = `@${m.userId?.name || 'member'} `;
                    setNewCommentBody((prev) => prev + handle);
                  }}
                  className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 dark:text-slate-300 font-medium shrink-0 transition-colors"
                >
                  @{m.userId?.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingComment || !newCommentBody.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingComment ? 'Posting...' : 'Post Message'}
            </button>
          </div>
        </form>

        {/* Comments Feed */}
        {loadingComments ? (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse"
              />
            ))}
          </div>
        ) : rootComments.length === 0 ? (
          <div className="p-12 text-center border-t border-slate-100 dark:border-slate-800 text-slate-400 text-xs">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
            No discussions yet. Be the first to share an idea or ask a question!
          </div>
        ) : (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
            {rootComments.map((comment) => {
              const replies = getReplies(comment._id);
              const isAuthor = comment.author?._id === user?._id;
              const canDelete = isAuthor || isLeader;

              return (
                <div key={comment._id} className="pt-4 first:pt-0 space-y-3">
                  {/* Root Comment Item */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {comment.author?.name?.[0]?.toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {comment.author?.name || 'Unknown'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {comment.author?.globalRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                        {comment.body}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px]">
                        <button
                          onClick={() => {
                            setReplyingToId(
                              replyingToId === comment._id ? null : comment._id
                            );
                            setReplyBody(`@${comment.author?.name} `);
                          }}
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <CornerDownRight className="w-3 h-3" /> Reply
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-slate-400 hover:text-rose-500 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {replies.length > 0 && (
                    <div className="ml-10 space-y-3 border-l-2 border-slate-100 dark:border-slate-800 pl-4 pt-1">
                      {replies.map((reply) => {
                        const isReplyAuthor = reply.author?._id === user?._id;
                        const canDeleteReply = isReplyAuthor || isLeader;

                        return (
                          <div key={reply._id} className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {reply.author?.name?.[0]?.toUpperCase() || 'U'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {reply.author?.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap">
                                {reply.body}
                              </p>

                              {canDeleteReply && (
                                <button
                                  onClick={() => handleDeleteComment(reply._id)}
                                  className="text-[10px] text-slate-400 hover:text-rose-500 mt-1 flex items-center gap-0.5"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Reply Box */}
                  {replyingToId === comment._id && (
                    <div className="ml-10 flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder={`Reply to ${comment.author?.name}...`}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostReply(comment._id);
                          }
                        }}
                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handlePostReply(comment._id)}
                        disabled={submittingComment || !replyBody.trim()}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setReplyingToId(null)}
                        className="p-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Post Project Announcement
              </h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Freeze & Sprint Demo Date"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Body *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Details for all team members..."
                  value={announcementBody}
                  onChange={(e) => setAnnouncementBody(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="announcementPinned"
                  checked={announcementPinned}
                  onChange={(e) => setAnnouncementPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <label
                  htmlFor="announcementPinned"
                  className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin announcement to top
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAnnouncement}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors"
                >
                  {submittingAnnouncement ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

