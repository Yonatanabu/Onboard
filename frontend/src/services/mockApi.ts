const STORAGE_KEYS = {
	currentUser: 'currentUser',
	announcements: 'announcements',
};

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

const read = <T>(key: string, fallback: T): T => {
	const value = window.localStorage.getItem(key);
	if (!value) return fallback;
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
};

const write = (key: string, value: unknown) => {
	window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeRole = (role: string) => String(role || 'employee').toLowerCase();

const roleToBackend = (role: string) => {
	const normalized = normalizeRole(role);
	if (normalized === 'admin') return 'Admin';
	if (normalized === 'mentor') return 'Mentor';
	return 'Employee';
};

const roleFromBackend = (role: string, isAdmin = false) => {
	const normalized = String(role || '').toLowerCase();
	if (isAdmin || normalized === 'admin' || normalized === 'owner' || normalized === 'hr/admin') return 'admin';
	if (normalized === 'mentor' || normalized === 'buddy') return 'mentor';
	return 'employee';
};

const departmentToPosition = (department: string, role: string) => {
	const normalizedRole = normalizeRole(role);
	if (normalizedRole === 'mentor') return 'Mentor';
	if (normalizedRole === 'admin') return 'Admin';

	const map: Record<string, string> = {
		frontend: 'Product Designer',
		backend: 'Backend Developer',
		mobile: 'Mobile Developer',
		design: 'Product Designer',
		qa: 'QA Engineer',
		marketing: 'Marketing Specialist',
		sales: 'Sales Representative',
	};

	return map[String(department || '').toLowerCase()] || 'Employee';
};

const positionToDepartment = (position: string, role: string) => {
	const normalizedRole = normalizeRole(role);
	if (normalizedRole === 'admin') return 'marketing';

	const normalized = String(position || '').toLowerCase();
	if (normalized.includes('backend')) return 'backend';
	if (normalized.includes('mobile')) return 'mobile';
	if (normalized.includes('design') || normalized.includes('product')) return 'design';
	if (normalized.includes('qa')) return 'qa';
	if (normalized.includes('marketing')) return 'marketing';
	if (normalized.includes('sales')) return 'sales';
	return 'frontend';
};

const toDepartmentKey = (value: string) => {
	const normalized = String(value || '').toLowerCase();
	if (['frontend', 'backend', 'mobile', 'design', 'qa', 'marketing', 'sales'].includes(normalized)) return normalized;
	if (normalized.includes('backend')) return 'backend';
	if (normalized.includes('mobile')) return 'mobile';
	if (normalized.includes('design') || normalized.includes('product')) return 'design';
	if (normalized.includes('qa')) return 'qa';
	if (normalized.includes('marketing')) return 'marketing';
	if (normalized.includes('sales')) return 'sales';
	return 'frontend';
};

const mapUser = (user: any) => {
	const role = roleFromBackend(user.role, user.isAdmin);
	const approvalStatus = String(user.approvalStatus || (user.approved ? 'approved' : 'pending')).toLowerCase();
	return {
		id: user._id,
		name: user.name,
		email: user.email,
		role,
		position: departmentToPosition(user.department, role),
		buddyId: user.buddyUser || null,
		approved: user.approved ?? true,
		approvalStatus,
		approvedAt: user.approvedAt || null,
		createdAt: user.createdAt,
		completedLessons: user.completedLessons || [],
		department: user.department,
	};
};

const mapLesson = (lesson: any) => ({
	id: lesson._id,
	title: lesson.title,
	description: lesson.description || '',
	content: lesson.content || lesson.description || '',
	position: lesson.position || lesson.role || 'All',
	status: lesson.status || 'Published',
	url: lesson.url || '',
	createdBy: lesson.author || null,
	deadline: lesson.deadline || null,
	createdAt: lesson.createdAt,
	completed: Boolean(lesson.completed),
	targetMentees: lesson.targetMentees || [],
});

export const getCurrentUser = () => read<any>(STORAGE_KEYS.currentUser, null);

const saveCurrentUser = (user: any) => write(STORAGE_KEYS.currentUser, user);

const authHeader = () => {
	const current = getCurrentUser();
	if (!current?.token) return {};
	return { Authorization: `Bearer ${current.token}` };
};

const request = async (path: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) => {
	const doFetch = async (tokenOverride?: string) => {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		};
		if (tokenOverride) {
			headers.Authorization = `Bearer ${tokenOverride}`;
		} else {
			const ah = authHeader();
			Object.assign(headers, ah);
		}
		// include refresh token header so the server middleware can attempt silent refresh
		const current = getCurrentUser();
		if (current?.refreshToken && !String(path || '').toLowerCase().includes('/auth/refresh')) {
			headers['x-refresh-token'] = current.refreshToken;
		}

		return fetch(`${API_BASE}${path}`, {
			method: options.method || 'GET',
			headers,
			body: options.body ? JSON.stringify(options.body) : undefined,
		});
	};

	let response = await doFetch();

	// If unauthorized, try refreshing token once when refreshToken exists
	if (response.status === 401) {
		const current = getCurrentUser();
		if (current?.refreshToken) {
			try {
				const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token: current.refreshToken }),
				});

				if (refreshRes.ok) {
					const tokens = await refreshRes.json();
					// tokens: { token, refreshToken }
					const updated = { ...current, token: tokens.token, refreshToken: tokens.refreshToken };
					saveCurrentUser(updated);
					// retry original request with new token
					response = await doFetch(tokens.token);
				} else {
					// refresh failed - clear stored user
					window.localStorage.removeItem(STORAGE_KEYS.currentUser);
					// fall through to error handling below
				}
			} catch (err) {
				// network or other error during refresh - clear stored user
				window.localStorage.removeItem(STORAGE_KEYS.currentUser);
			}
		}
	}

	if (!response.ok) {
		// try to extract a useful message from response body
		let message = response.statusText || 'Request failed';
		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			const data = await response.json().catch(() => null);
			if (data && data.message) message = data.message;
		} else {
			let text = await response.text().catch(() => '');
			if (text) {
				if (/^\s*</.test(text)) {
					const stripped = text.replace(/<[^>]+>/g, '');
					if (stripped.trim()) {
						message = stripped.trim();
					}
				} else {
					message = text;
				}
			}
		}
		throw new Error(message);
	}

	const contentType = response.headers.get('content-type') || '';
	// if server issued a refreshed access token, persist it immediately
	const newAccess = response.headers.get('x-access-token');
	if (newAccess) {
		const current = getCurrentUser();
		if (current) {
			saveCurrentUser({ ...current, token: newAccess });
		}
	}
	return contentType.includes('application/json') ? await response.json() : null;
};

export const getAllUsers = async () => {
	const data = await request('/employees');
	return data.map(mapUser);
};

export const authenticateUser = async ({ email, password }: { email: string; password: string }) => {
	const data = await request('/auth/login', {
		method: 'POST',
		body: { email, password },
	});

	const normalizedRole = roleFromBackend(data.role, data.isAdmin);

	const currentUser = {
		id: data._id,
		name: data.name,
		email: data.email,
		role: normalizedRole,
		buddyId: data.buddyUser || null,
		position: departmentToPosition(data.department, normalizedRole),
		department: data.department,
		approved: data.approved ?? true,
		token: data.token,
		refreshToken: data.refreshToken,
	};

	saveCurrentUser(currentUser);
	return currentUser;
};

export const createUser = async (user: any) => {
	const created = await request('/employees', {
		method: 'POST',
		body: {
			name: String(user.name || '').trim(),
			email: String(user.email || '').trim().toLowerCase(),
			password: String(user.password || 'password123'),
			role: roleToBackend(user.role),
			department: positionToDepartment(user.position, user.role),
		},
	});

	return mapUser(created);
};

export const submitSignupRequest = async ({ name, email, password, role, department }: { name: string; email: string; password: string; role: string; department?: string }) => {
	return request('/auth/signup', {
		method: 'POST',
		body: {
			name,
			email,
			password,
			role: roleToBackend(role),
			department,
		},
	});
};

export const getPendingApprovalRequests = async () => {
	const users = await request('/employees/pending');
	return users.map((user: any) => ({
		id: `approval-${user._id}`,
		userId: user._id,
		name: user.name,
		email: user.email,
		role: roleFromBackend(user.role, user.isAdmin),
		status: 'pending',
		createdAt: user.createdAt,
	}));
};

export const approveSignupRequest = async (userId: string) => {
	await request(`/employees/approve/${userId}`, { method: 'PUT' });
	const users = await getAllUsers();
	return users.find((user: any) => user.id === userId) || null;
};

export const rejectSignupRequest = async (userId: string) => {
	await request(`/employees/reject/${userId}`, { method: 'PUT' });
	const users = await getAllUsers();
	return users.find((user: any) => user.id === userId) || null;
};

export const deleteUser = async (userId: string) => {
	await request(`/employees/${userId}`, { method: 'DELETE' });
	return getAllUsers();
};

export const getAllLessons = async () => {
	const data = await request('/lessons');
	return data.map(mapLesson);
};

export const createLesson = async (lesson: any) => {
	const data = await request('/lessons', {
		method: 'POST',
		body: {
			title: String(lesson.title || '').trim(),
			description: String(lesson.description || '').trim(),
			content: String(lesson.content || lesson.description || '').trim(),
			position: lesson.position || 'All',
			role: lesson.position || 'All',
			menteeIds: Array.isArray(lesson.menteeIds) ? lesson.menteeIds : [],
			url: lesson.url || '',
			deadline: lesson.deadline || null,
			status: lesson.status || 'Published',
		},
	});

	return mapLesson(data);
};

export const updateLesson = async (lessonId: string, updates: any) => {
	const data = await request(`/lessons/${lessonId}`, {
		method: 'PUT',
		body: {
			title: updates.title,
			description: updates.description,
			content: updates.content,
			position: updates.position,
			role: updates.position,
			url: updates.url,
			deadline: updates.deadline,
			status: updates.status,
		},
	});

	return mapLesson(data);
};

export const deleteLesson = async (lessonId: string) => {
	await request(`/lessons/${lessonId}`, { method: 'DELETE' });
	return getAllLessons();
};

export const assignMentor = async (employeeId: string, mentorId: string) => {
	await request('/employees/mentor', {
		method: 'POST',
		body: { userId: employeeId, mentorId },
	});

	const users = await getAllUsers();
	return users.find((user: any) => user.id === employeeId) || null;
};

export const getMentorEmployees = async (mentorId: string) => {
	const current = getCurrentUser();
	const currentRole = String(current?.role || '').toLowerCase();
	if (currentRole === 'mentor') {
		const users = await request('/employees/mentor/mentees');
		const mapped = (users || []).map(mapUser);
		// If backend returned very few mentees (seed may use Buddy model), fall back to department membership
		if ((!mapped || mapped.length <= 1) && current?.department) {
			try {
				const all = await getAllUsers();
				const deptList = all.filter((u: any) => String(u.department || '').toLowerCase() === String(current.department || '').toLowerCase() && u.id !== current.id && String(u.role || '').toLowerCase() === 'employee');
				if (deptList.length) return deptList;
			} catch (err) {
				// ignore and return mapped
			}
		}
		return mapped;
	}

	// Fallback: fetch all users and filter by buddyId matching mentorId
	const users = await getAllUsers();
	return users.filter((user: any) => String(user.role || '').toLowerCase() === 'employee' && String(user.buddyId || '') === String(mentorId));
};

export const getEmployeeProgress = async (employeeId: string) => {
	const data = await request(`/employees/${employeeId}/progress`);
	return {
		employee: mapUser(data.employee),
		completed: data.completed,
		total: data.total,
		percentage: data.percentage,
		items: data.items || [],
	};
};

export const getLessonsByPosition = async (position: string) => {
	const department = String(position || 'All').toLowerCase() === 'all' ? 'All' : toDepartmentKey(position);
	const data = await request(`/lessons?position=${encodeURIComponent(department)}`);
	return data.map(mapLesson);
};

export const getEmployeeLessons = async (userId: string) => {
	try {
		const data = await request(`/employees/${encodeURIComponent(userId)}/progress`);
		return (data.items || []).map((it: any) => ({
			id: it.id || it.lessonId,
			// robust title resolution: backend may return title or name or lessonTitle
			title: it.title || it.name || it.lessonTitle || (it.body ? String(it.body).slice(0, 80) : ''),
			description: it.description || it.body || '',
			position: it.position || it.role || '',
			url: it.url || '',
			completed: Boolean(it.completed),
		}));
	} catch (err) {
		return [];
	}
};

export const getLessonProgress = async (userId: string) => {
	try {
		const data = await request(`/employees/${encodeURIComponent(userId)}/progress`);
		return (data.items || []).map((it: any) => ({ userId, lessonId: it.lessonId || it.id, completed: Boolean(it.completed) }));
	} catch (err) {
		return [];
	}
};

export const completeLesson = async (_userId: string, lessonId: string) => {
	await request(`/lessons/${lessonId}/complete`, { method: 'POST' });
};

export const getBuddyInfo = async (_buddyId: string | null) => {
	const current = getCurrentUser();
	if (current?.role !== 'employee') return null;
	const data = await request('/employees/me/buddy');
	if (!data) return null;
	const mapped = mapUser(data);
	return {
		id: mapped.id,
		name: mapped.name,
		email: mapped.email,
		position: mapped.position,
		department: mapped.department,
	};
};

export const updateEmployeeSettings = async (_userId: string, data: { name?: string; email?: string }) => {
	const updated = await request('/employees/profile', {
		method: 'PUT',
		body: {
			name: data.name,
			email: data.email,
		},
	});

	const currentUser = getCurrentUser();
	if (currentUser) {
		saveCurrentUser({
			...currentUser,
			name: updated.name,
			email: updated.email,
			position: departmentToPosition(updated.department, roleFromBackend(updated.role, updated.isAdmin)),
		});
	}

	return mapUser(updated);
};

export const logout = () => {
	const currentUser = getCurrentUser();
	if (currentUser?.refreshToken) {
		request('/auth/logout', {
			method: 'POST',
			body: { token: currentUser.refreshToken },
		}).catch(() => undefined);
	}
	window.localStorage.removeItem(STORAGE_KEYS.currentUser);
};

export const getAnnouncements = () => read<any[]>(STORAGE_KEYS.announcements, []);

// Legacy/local announcement helper is implemented below as createAnnouncementLocal

export const createMentorTip = async (message: string, menteeIds: string[] = []) => {
	const data = await request('/mentor-tips', {
		method: 'POST',
		body: { message, menteeIds },
	});
	return {
		id: data._id,
		message: data.message,
		createdAt: data.createdAt,
		mentees: data.mentees || [],
	};
};

export const sendMessage = async (to: string, text: string) => {
	const data = await request('/messages', { method: 'POST', body: { to, text } });
	return {
		id: data._id || data.id,
		from: data.from,
		to: data.to,
		text: data.text,
		createdAt: data.createdAt,
		read: Boolean(data.read),
	};
};

export const getConversation = async (otherId: string) => {
	const data = await request(`/messages/${encodeURIComponent(otherId)}`);
	return (data || []).map((m: any) => ({
		id: m._id || m.id,
		from: m.from && (m.from._id || m.from) ? (m.from._id || m.from) : m.from,
		to: m.to && (m.to._id || m.to) ? (m.to._id || m.to) : m.to,
		text: m.text,
		createdAt: m.createdAt,
		read: Boolean(m.read),
	}));
};

export const getUserConversations = async () => {
	const data = await request('/messages/conversations');
	return (data || []).map((c: any) => ({ partnerId: c.partnerId, partnerName: c.partnerName || c.partnerId, partnerEmail: c.partnerEmail || '', lastMessage: c.lastMessage, lastAt: c.lastAt, unread: Boolean(c.unread) }));
};

export const markMessageRead = async (messageId: string) => {
	await request(`/messages/${encodeURIComponent(messageId)}/read`, { method: 'PUT' });
};

export const markMessageUnread = async (messageId: string) => {
	await request(`/messages/${encodeURIComponent(messageId)}/unread`, { method: 'PUT' });
};

export const getUnreadMessageCount = async () => {
	try {
		const conv = await getUserConversations();
		return conv.filter((c: any) => c.unread).length;
	} catch {
		return 0;
	}
};

export const createAnnouncement = async (title: string, body: string, department: string | null = null, targetRoles: string[] = []) => {
	try {
		const payload: any = { title, body };
		if (department) payload.department = department;
		if (Array.isArray(targetRoles) && targetRoles.length) payload.targetRoles = targetRoles;
		const data = await request('/announcements', { method: 'POST', body: payload });
		return {
			id: data._id,
			title: data.title,
			message: data.body,
			department: data.department,
			targetRoles: data.targetRoles || [],
			createdAt: data.createdAt,
		};
	} catch (err) {
		// fallback to local storage announcement when backend not available
		return createAnnouncementLocal(title, body);
	}
};

const createAnnouncementLocal = (title: string, body: string) => {
	const announcements = getAnnouncements();
	const item = { id: `announcement-${Date.now()}`, title, message: body, createdAt: new Date().toISOString() };
	announcements.unshift(item);
	write(STORAGE_KEYS.announcements, announcements.slice(0, 50));
	return item;
};

export const getAnnouncementsFeed = async () => {
	try {
		const data = await request('/announcements/feed');
		return data.map((a: any) => ({ id: a._id, title: a.title, message: a.body, department: a.department, createdAt: a.createdAt, createdBy: a.createdBy }));
	} catch (err) {
		return getAnnouncements();
	}
};

export const markAnnouncementRead = async (announcementId: string) => {
	await request(`/announcements/${encodeURIComponent(announcementId)}/read`, { method: 'PUT' });
};

export const markAnnouncementUnread = async (announcementId: string) => {
	await request(`/announcements/${encodeURIComponent(announcementId)}/unread`, { method: 'PUT' });
};

export const getAllAnnouncements = async () => {
	const data = await request('/announcements');
	return data.map((a: any) => ({ id: a._id, title: a.title, message: a.body, department: a.department, targetRoles: a.targetRoles || [], createdAt: a.createdAt, createdBy: a.createdBy, readBy: a.readBy || [] }));
};

export const deleteAnnouncement = async (announcementId: string) => {
	await request(`/announcements/${encodeURIComponent(announcementId)}`, { method: 'DELETE' });
};

export const getUnreadAnnouncementCount = async () => {
	try {
		const data = await getAnnouncementsFeed();
		return data.filter((a: any) => !a.read).length;
	} catch {
		return 0;
	}
};

export const getMentorTipsForMentor = async () => {
	const data = await request('/mentor-tips/mine');
	return data.map((tip: any) => ({
		id: tip._id,
		message: tip.message,
		createdAt: tip.createdAt,
		mentees: tip.mentees || [],
	}));
};

export const getMentorTipsFeed = async () => {
	const data = await request('/mentor-tips/feed');
	return data.map((tip: any) => ({
		id: tip._id,
		message: tip.message,
		createdAt: tip.createdAt,
		mentorName: tip.mentor?.name || 'Mentor',
		mentorEmail: tip.mentor?.email || '',
	}));
};

export const getNotifications = async () => {
	try {
		const data = await request('/notifications');
		// map to simple notification bodies for display
		return (data || []).map((n: any) => ({ id: n._id, title: n.title, body: n.body, read: !!n.read, createdAt: n.createdAt }));
	} catch {
		return [];
	}
};
