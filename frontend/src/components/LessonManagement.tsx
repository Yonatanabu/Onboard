import React from 'react';
import { Button, Card, Badge } from './UI';
import { createLesson, deleteLesson, getAllLessons, getCurrentUser, getLessonsByPosition, updateLesson, getMentorEmployees } from '../services/mockApi.ts';
import { useToast } from './Toast';

export const LessonManagement: React.FC = () => {
  const { showToast } = useToast();
  const [lessons, setLessons] = React.useState<Array<{
    id: string;
    title: string;
    description: string;
    content?: string;
    position: string;
    status?: string;
    deadline?: string | null;
    createdAt?: string;
    createdBy?: string;
    url?: string;
  }>>([]);
  const [currentRole, setCurrentRole] = React.useState<'employee' | 'admin' | 'mentor'>('employee');
  const [statusFilter, setStatusFilter] = React.useState<'All' | 'Published' | 'Draft' | 'Archived'>('All');
  const [departmentFilter, setDepartmentFilter] = React.useState<'All' | 'Engineering' | 'Marketing' | 'Sales' | 'Product'>('All');
  const [page, setPage] = React.useState(1);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingLessonId, setEditingLessonId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [newDepartment, setNewDepartment] = React.useState('All');
  const ALL_POSITIONS = ['All', 'frontend', 'backend', 'mobile', 'design', 'qa', 'marketing', 'sales'];
  const [positionOptions, setPositionOptions] = React.useState<string[]>(['All']);
  const [newStatus, setNewStatus] = React.useState<'Published' | 'Draft' | 'Archived'>('Published');
  const [newDeadline, setNewDeadline] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [newUrl, setNewUrl] = React.useState('');
  const [mentorMentees, setMentorMentees] = React.useState<Array<{ id: string; name: string; department?: string }>>([]);
  const [selectedMentee, setSelectedMentee] = React.useState<'all' | string>('all');
  const pageSize = 6;

  const loadLessons = React.useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setLessons([]);
      return;
    }

    const normalizedRole = String(currentUser.role || 'employee').toLowerCase();
    setCurrentRole(normalizedRole as 'employee' | 'admin' | 'mentor');

    if (normalizedRole === 'mentor') {
      const mentees = await getMentorEmployees(currentUser.id || '');
      setMentorMentees(mentees);

      const mentorDepartment = String(currentUser.department || mentees[0]?.department || 'frontend').toLowerCase();
      setPositionOptions([mentorDepartment]);
      setNewDepartment(mentorDepartment);

      const departmentLessons = await getLessonsByPosition(mentorDepartment);
      const scoped = departmentLessons.filter((lesson) => String(lesson.createdBy || '') === String(currentUser.id));
      setLessons(scoped);
      return;
    }

    if (normalizedRole === 'admin') {
      // admins see everything and can choose any position
      const all = await getAllLessons();
      setLessons(all);
      setPositionOptions(ALL_POSITIONS);
      return;
    }

    // regular employees only see lessons for their position
    const byPos = await getLessonsByPosition(currentUser.position || 'All');
    setLessons(byPos);
  }, []);

  const resetLessonForm = () => {
    setNewTitle('');
    setNewDepartment('All');
    setNewStatus('Published');
    setNewDeadline('');
    setNewDescription('');
    setNewUrl('');
    setSelectedMentee('all');
    setEditingLessonId(null);
    setShowAddForm(false);
  };

  const handleSubmitLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (currentRole !== 'admin' && currentRole !== 'mentor') {
      return;
    }

    if (!newTitle.trim()) {
      return;
    }

    if (editingLessonId) {
      await updateLesson(editingLessonId, {
        title: newTitle.trim(),
        description: newDescription.trim() || 'New onboarding lesson',
        content: newDescription.trim() || 'New onboarding lesson',
        position: newDepartment,
        url: newUrl.trim(),
        deadline: newDeadline.trim() || null,
        status: newStatus,
      });
    } else {
      const menteeIds = currentRole === 'mentor'
        ? selectedMentee === 'all'
          ? mentorMentees.map((mentee) => mentee.id)
          : [selectedMentee]
        : [];

      await createLesson({
        title: newTitle.trim(),
        description: newDescription.trim() || 'New onboarding lesson',
        content: newDescription.trim() || 'New onboarding lesson',
        position: newDepartment,
        menteeIds,
        url: newUrl.trim(),
        deadline: newDeadline.trim() || null,
        status: newStatus,
      });
    }

    showToast(editingLessonId ? 'Lesson updated.' : 'Lesson created successfully.', 'success');
    resetLessonForm();
    await loadLessons();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (currentRole !== 'admin') {
      return;
    }

    await deleteLesson(lessonId);
    await loadLessons();
  };

  const handleEditLesson = (lessonId: string) => {
    if (currentRole !== 'admin') {
      return;
    }

    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      return;
    }

    setEditingLessonId(lesson.id);
    setNewTitle(lesson.title || '');
    setNewDepartment(lesson.position || 'All');
    setNewStatus((lesson.status as 'Published' | 'Draft' | 'Archived') || 'Published');
    setNewDeadline(lesson.deadline || '');
    setNewDescription(lesson.description || '');
    setNewUrl(lesson.url || '');
    setShowAddForm(true);
  };

  const filteredLessons = React.useMemo(() => {
    const byStatus =
      statusFilter === 'All'
        ? lessons
        : lessons.filter((lesson) => String(lesson.status || 'Published') === statusFilter);

    if (departmentFilter === 'All') {
      return byStatus;
    }

    return byStatus.filter((lesson) => {
      const normalized = String(lesson.position || '').toLowerCase();
      if (departmentFilter === 'Engineering') return normalized.includes('engineer');
      if (departmentFilter === 'Marketing') return normalized.includes('marketing');
      if (departmentFilter === 'Sales') return normalized.includes('sales');
      if (departmentFilter === 'Product') return normalized.includes('product') || normalized.includes('design');
      return true;
    });
  }, [lessons, statusFilter, departmentFilter]);

  const pagedLessons = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLessons.slice(start, start + pageSize);
  }, [filteredLessons, page]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize));
  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // initial load to determine role and fetch lessons
  React.useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const publishedCount = lessons.filter((lesson) => String(lesson.status || 'Published') === 'Published').length;
  const draftsCount = lessons.filter((lesson) => String(lesson.status || 'Published') === 'Draft').length;
  const archivedCount = lessons.filter((lesson) => String(lesson.status || 'Published') === 'Archived').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">Lessons</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Organize and monitor onboarding curriculum across departments.</p>
        </div>
        <Button
          icon="add"
          size="lg"
          onClick={() => {
            if (showAddForm) {
              resetLessonForm();
              return;
            }
            setEditingLessonId(null);
            setShowAddForm(true);
          }}
        >
          {showAddForm ? 'Close Form' : 'Add Lesson'}
        </Button>
      </div>

      {showAddForm && (currentRole === 'admin' || currentRole === 'mentor') && (
        <Card className="p-6">
          <form onSubmit={handleSubmitLesson} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Lesson title"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <select
              value={newDepartment}
              onChange={(event) => setNewDepartment(event.target.value)}
              disabled={currentRole === 'mentor'}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {positionOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {currentRole === 'mentor' && (
              <select
                value={selectedMentee}
                onChange={(event) => setSelectedMentee(event.target.value as 'all' | string)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="all">All my mentees</option>
                {mentorMentees.map((mentee) => (
                  <option key={mentee.id} value={mentee.id}>{mentee.name}</option>
                ))}
              </select>
            )}
            <select
              value={newStatus}
              onChange={(event) => setNewStatus(event.target.value as 'Published' | 'Draft' | 'Archived')}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
            <input
              type="date"
              value={newDeadline}
              onChange={(event) => setNewDeadline(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Optional video/pdf URL"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <Button type="submit" size="sm">{editingLessonId ? 'Save' : 'Create'}</Button>
            <textarea
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Lesson description"
              className="md:col-span-5 min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => setStatusFilter('All')} className={`border-b-2 px-6 py-3 text-sm font-bold ${statusFilter === 'All' ? 'border-slate-900 dark:border-primary text-slate-900 dark:text-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>All Lessons</button>
          <button onClick={() => setStatusFilter('Published')} className={`border-b-2 px-6 py-3 text-sm font-bold ${statusFilter === 'Published' ? 'border-slate-900 dark:border-primary text-slate-900 dark:text-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>Published ({publishedCount})</button>
          <button onClick={() => setStatusFilter('Draft')} className={`border-b-2 px-6 py-3 text-sm font-bold ${statusFilter === 'Draft' ? 'border-slate-900 dark:border-primary text-slate-900 dark:text-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>Drafts ({draftsCount})</button>
          <button onClick={() => setStatusFilter('Archived')} className={`border-b-2 px-6 py-3 text-sm font-bold ${statusFilter === 'Archived' ? 'border-slate-900 dark:border-primary text-slate-900 dark:text-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>Archived ({archivedCount})</button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Filter By Role:</span>
          <Badge variant="info">{departmentFilter === 'All' ? 'All Roles' : departmentFilter} <span className="material-symbols-outlined text-xs ml-1 align-middle">close</span></Badge>
          <Button variant="outline" size="sm" icon="expand_more" onClick={() => setDepartmentFilter('Engineering')}>Engineering</Button>
          <Button variant="outline" size="sm" icon="expand_more" onClick={() => setDepartmentFilter('Marketing')}>Marketing</Button>
          <Button variant="outline" size="sm" icon="expand_more" onClick={() => setDepartmentFilter('Sales')}>Sales</Button>
          <Button variant="outline" size="sm" icon="expand_more" onClick={() => setDepartmentFilter('Product')}>Product</Button>
          <Button variant="outline" size="sm" onClick={() => setDepartmentFilter('All')}>Reset</Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Lesson Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Modules</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Last Modified</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagedLessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined text-xl">menu_book</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{lesson.title}</p>
                        <p className="text-xs text-slate-500">{lesson.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="info">{lesson.position}</Badge>
                    {lesson.url && (
                      <div className="mt-1 text-xs">
                        <a href={lesson.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          View resource
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-base">format_list_numbered</span>
                      <span>1 step</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${String(lesson.status || 'Published') === 'Published' ? 'bg-primary' : String(lesson.status || 'Published') === 'Draft' ? 'bg-slate-400' : 'bg-red-400'}`}></span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{lesson.status || 'Published'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500">{lesson.deadline || 'No deadline'}</td>
                  <td className="px-6 py-5 text-right">
                    {currentRole === 'admin' && (
                      <>
                        <button className="text-slate-400 hover:text-primary transition-colors" onClick={() => handleEditLesson(lesson.id)}>
                          <span className="material-symbols-outlined">edit_square</span>
                        </button>
                        <button className="ml-4 text-slate-400 hover:text-red-500 transition-colors" onClick={() => handleDeleteLesson(lesson.id)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
          <span className="text-xs font-medium text-slate-500">Showing {pagedLessons.length} of {filteredLessons.length} lessons</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((previous) => Math.max(1, previous - 1))} className={`flex h-8 w-8 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs">{page}</button>
            <button onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))} className={`flex h-8 w-8 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
