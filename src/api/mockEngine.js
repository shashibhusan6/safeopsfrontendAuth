import {
  INITIAL_USERS,
  INITIAL_PLANTS,
  INITIAL_ZONES,
  INITIAL_CAMERAS,
  INITIAL_SUPER_ADMIN_ALERTS,
  INITIAL_SUPER_ADMIN_METRICS,
  INITIAL_ATTENDANCE,
  INITIAL_SAFETY_RULES,
  INITIAL_CAMERA_REGIONS,
  INITIAL_CCTV_VIDEOS,
  INITIAL_VIDEO_JOBS,
  INITIAL_DETECTION_EVENTS,
  INITIAL_INCIDENTS,
} from './mockData.js';

class MockEngine {
  constructor() {
    this.users = [...INITIAL_USERS];
    this.plants = [...INITIAL_PLANTS];
    this.zones = [...INITIAL_ZONES];
    this.cameras = [...INITIAL_CAMERAS];
    this.alerts = [...INITIAL_SUPER_ADMIN_ALERTS];
    this.attendance = [...INITIAL_ATTENDANCE];
    this.metrics = { ...INITIAL_SUPER_ADMIN_METRICS };

    this.safetyRules = [...INITIAL_SAFETY_RULES];
    this.cameraRegions = [...INITIAL_CAMERA_REGIONS];
    this.cctvVideos = [...INITIAL_CCTV_VIDEOS];
    this.videoJobs = [...INITIAL_VIDEO_JOBS];
    this.detectionEvents = [...INITIAL_DETECTION_EVENTS];
    this.incidents = [...INITIAL_INCIDENTS];

    this.activeRole = 'super_admin';
    this.currentUser = INITIAL_USERS[0];

    this.loadFromStorage();
  }

  saveToStorage() {
    try {
      localStorage.setItem('safeops_mock_users', JSON.stringify(this.users));
      localStorage.setItem('safeops_mock_plants', JSON.stringify(this.plants));
      localStorage.setItem('safeops_mock_zones', JSON.stringify(this.zones));
      localStorage.setItem('safeops_mock_cameras', JSON.stringify(this.cameras));
      localStorage.setItem('safeops_mock_alerts', JSON.stringify(this.alerts));
      localStorage.setItem('safeops_mock_attendance', JSON.stringify(this.attendance));
      localStorage.setItem('safeops_mock_safety_rules', JSON.stringify(this.safetyRules));
      localStorage.setItem('safeops_mock_camera_regions', JSON.stringify(this.cameraRegions));
      localStorage.setItem('safeops_mock_cctv_videos', JSON.stringify(this.cctvVideos));
      localStorage.setItem('safeops_mock_video_jobs', JSON.stringify(this.videoJobs));
      localStorage.setItem('safeops_mock_detection_events', JSON.stringify(this.detectionEvents));
      localStorage.setItem('safeops_mock_incidents', JSON.stringify(this.incidents));
      localStorage.setItem('safeops_mock_active_role', this.activeRole);
      if (this.currentUser) {
        localStorage.setItem('safeops_mock_current_user_id', String(this.currentUser.id));
      } else {
        localStorage.removeItem('safeops_mock_current_user_id');
      }
    } catch {
      // ignore
    }
  }

  loadFromStorage() {
    try {
      const u = localStorage.getItem('safeops_mock_users');
      const p = localStorage.getItem('safeops_mock_plants');
      const z = localStorage.getItem('safeops_mock_zones');
      const c = localStorage.getItem('safeops_mock_cameras');
      const alt = localStorage.getItem('safeops_mock_alerts');
      const att = localStorage.getItem('safeops_mock_attendance');
      const sr = localStorage.getItem('safeops_mock_safety_rules');
      const cr = localStorage.getItem('safeops_mock_camera_regions');
      const cv = localStorage.getItem('safeops_mock_cctv_videos');
      const vj = localStorage.getItem('safeops_mock_video_jobs');
      const de = localStorage.getItem('safeops_mock_detection_events');
      const inc = localStorage.getItem('safeops_mock_incidents');
      const r = localStorage.getItem('safeops_mock_active_role');
      const uid = localStorage.getItem('safeops_mock_current_user_id');
      if (u) {
        const parsedUsers = JSON.parse(u);
        this.users = parsedUsers.map((su) => {
          const init = INITIAL_USERS.find((iu) => iu.email.toLowerCase() === su.email.toLowerCase());
          if (init && init.plant_id !== undefined && (su.plant_id === undefined || su.plant_id === null)) {
            return { ...su, plant_id: init.plant_id };
          }
          return su;
        });
      }
      if (p) this.plants = JSON.parse(p);
      if (z) this.zones = JSON.parse(z);
      if (c) this.cameras = JSON.parse(c);
      if (alt) this.alerts = JSON.parse(alt);
      if (att) this.attendance = JSON.parse(att);
      if (sr) this.safetyRules = JSON.parse(sr);
      if (cr) this.cameraRegions = JSON.parse(cr);
      if (cv) this.cctvVideos = JSON.parse(cv);
      if (vj) this.videoJobs = JSON.parse(vj);
      if (de) this.detectionEvents = JSON.parse(de);
      if (inc) this.incidents = JSON.parse(inc);
      if (c) this.cameras = JSON.parse(c);
      if (alt) this.alerts = JSON.parse(alt);
      if (att) this.attendance = JSON.parse(att);
      if (r) this.activeRole = r;
      if (uid) {
        const found = this.users.find((user) => String(user.id) === String(uid));
        if (found) {
          this.currentUser = found;
        }
      }
    } catch {
      // fallback
    }
  }

  setSimulatedRole(role) {
    this.activeRole = role;
    const found = this.users.find((u) => u.role === role && u.plant_id !== null);
    if (found) {
      this.currentUser = { ...found };
    } else {
      const sysDefault = INITIAL_USERS.find((u) => u.role === role && u.plant_id !== null);
      this.currentUser = sysDefault ? { ...sysDefault } : {
        id: 999,
        name: `Demo ${role.toUpperCase()}`,
        email: `${role}@safeops.io`,
        role: role,
        plant_id: 1,
        invite_status: 'accepted',
        account_status: 'active',
      };
    }
    this.saveToStorage();
  }

  getCurrentUser() {
    const plant = this.plants.find((p) => Number(p.id) === Number(this.currentUser?.plant_id)) || null;
    return { ...this.currentUser, role: this.activeRole, plant };
  }

  checkOperatorRestriction() {
    if (this.activeRole === 'operator') {
      const err = new Error('Forbidden: Operator role is strictly read-only.');
      err.response = { status: 403, data: { error: 'You do not have permission to perform this action.' } };
      throw err;
    }
  }

  // --- AUTH ---
  login(email, _password_hash) {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const err = new Error('Invalid email or password');
      err.response = { status: 401, data: { error: 'Invalid email or password' } };
      throw err;
    }

    if (user.account_status === 'disabled') {
      const err = new Error('Account is disabled');
      err.response = { status: 401, data: { error: 'Account is disabled' } };
      throw err;
    }

    this.activeRole = user.role;
    this.currentUser = user;
    this.saveToStorage();

    const plant = this.plants.find((p) => Number(p.id) === Number(user.plant_id)) || null;

    return {
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
      user: { ...user, plant },
    };
  }

  logout() {
    this.activeRole = 'super_admin';
    this.currentUser = INITIAL_USERS[0];
    try {
      localStorage.removeItem('safeops_mock_active_role');
      localStorage.removeItem('safeops_mock_current_user_id');
    } catch {
      // ignore
    }
    this.saveToStorage();
  }

  me() {
    if (this.currentUser?.account_status === 'disabled') {
      const err = new Error('Account is disabled');
      err.response = { status: 401, data: { error: 'Account is disabled' } };
      throw err;
    }
    const plant = this.plants.find((p) => Number(p.id) === Number(this.currentUser?.plant_id)) || null;
    return { user: { ...this.currentUser, role: this.activeRole, plant } };
  }

  acceptInvite(_token, _password_hash) {
    const user = this.users.find((u) => u.invite_status === 'pending');
    if (user) {
      user.invite_status = 'accepted';
      user.account_status = 'active';
      this.saveToStorage();
      return { message: 'Invitation accepted successfully. You can now log in.' };
    }
    return { message: 'Invite link valid. Password set successfully.' };
  }

  // --- USERS ---
  getUsers(page = 1, limit = 10, search = '', role = '', status = '') {
    let filtered = [...this.users];

    if (this.activeRole !== 'super_admin' && this.currentUser.plant_id) {
      filtered = filtered.filter((u) => u.plant_id === this.currentUser.plant_id || u.id === this.currentUser.id);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (status) {
      filtered = filtered.filter((u) => u.account_status === status);
    }

    const populated = filtered.map((u) => ({
      ...u,
      plant: this.plants.find((p) => p.id === u.plant_id) || null,
    }));

    const total = populated.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = populated.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  getUserById(id) {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      const err = new Error('User not found');
      err.response = { status: 404, data: { error: 'User not found' } };
      throw err;
    }
    return { ...user, plant: this.plants.find((p) => p.id === user.plant_id) || null };
  }

  inviteUser(data) {
    this.checkOperatorRestriction();

    if (this.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      const err = new Error('User email already exists');
      err.response = { status: 400, data: { error: 'User email already exists' } };
      throw err;
    }

    if (this.activeRole === 'admin') {
      if (data.role === 'super_admin') {
        const err = new Error('Admin cannot invite super_admin');
        err.response = { status: 403, data: { error: 'Plant admin cannot create or invite a super_admin.' } };
        throw err;
      }
      data.plant_id = this.currentUser.plant_id;
    }

    const newUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      role: data.role,
      plant_id: data.plant_id ?? null,
      invited_by: this.currentUser.id,
      invite_status: 'pending',
      account_status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.users.unshift(newUser);
    this.saveToStorage();
    return newUser;
  }

  enableUser(id) {
    this.checkOperatorRestriction();
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    user.account_status = 'active';
    this.saveToStorage();
    return { ...user };
  }

  disableUser(id) {
    this.checkOperatorRestriction();
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');

    if (user.role === 'super_admin') {
      const activeSuperAdmins = this.users.filter((u) => u.role === 'super_admin' && u.account_status === 'active');
      if (activeSuperAdmins.length <= 1) {
        const err = new Error('Cannot disable last super_admin');
        err.response = { status: 400, data: { error: 'The last active super_admin account cannot be disabled.' } };
        throw err;
      }
    }

    user.account_status = 'disabled';
    this.saveToStorage();
    return { ...user };
  }

  updateUserStatus(id, account_status) {
    return account_status === 'active' ? this.enableUser(id) : this.disableUser(id);
  }

  updateUser(id, data) {
    this.checkOperatorRestriction();
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');

    this.users[index] = { ...this.users[index], ...data, updatedAt: new Date().toISOString() };
    this.saveToStorage();
    return { ...this.users[index] };
  }

  deleteUser(id) {
    return this.disableUser(id);
  }

  // --- PLANTS ---
  getPlants(page = 1, limit = 10, search = '', status = '') {
    let filtered = [...this.plants];

    if (this.currentUser?.plant_id) {
      filtered = filtered.filter((p) => p.id === this.currentUser.plant_id);
    } else {
      filtered = [];
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
    }

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    const populated = filtered.map((p) => {
      const plantZones = this.zones.filter((z) => z.plant_id === p.id);
      const plantUsers = this.users.filter((u) => u.plant_id === p.id);
      const manager = plantUsers.find((u) => u.role === 'manager' || u.role === 'admin') || null;
      const plantZoneIds = plantZones.map((z) => z.id);
      const plantCameras = this.cameras.filter((c) => plantZoneIds.includes(c.zone_id));

      return {
        ...p,
        manager,
        _count: {
          zones: plantZones.length,
          users: plantUsers.length,
          cameras: plantCameras.length,
        },
      };
    });

    const total = populated.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = populated.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  getPlantById(id) {
    const targetId = Number(id);
    if (this.currentUser?.plant_id && targetId !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant facilities.');
      err.response = { status: 403, data: { error: 'Access denied: You do not have permission to view or manage another plant facility.' } };
      throw err;
    }

    const plant = this.plants.find((p) => p.id === targetId);
    if (!plant) {
      const err = new Error('Plant not found');
      err.response = { status: 404, data: { error: 'Plant not found' } };
      throw err;
    }
    const plantZones = this.zones.filter((z) => z.plant_id === plant.id);
    return {
      ...plant,
      zones: plantZones,
      _count: {
        zones: plantZones.length,
        users: this.users.filter((u) => u.plant_id === plant.id).length,
        cameras: this.cameras.filter((c) => plantZones.map((z) => z.id).includes(c.zone_id)).length,
      },
    };
  }

  createPlant(_data) {
    const err = new Error('Forbidden: Plant creation is disabled.');
    err.response = { status: 403, data: { error: 'Plant creation has been removed. Super Admins are assigned to individual plant facilities.' } };
    throw err;
  }

  enablePlant(id) {
    this.checkOperatorRestriction();
    const targetId = Number(id);
    if (this.currentUser?.plant_id && targetId !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant facilities.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot modify another plant facility.' } };
      throw err;
    }

    const plant = this.plants.find((p) => p.id === targetId);
    if (!plant) throw new Error('Plant not found');
    plant.status = 'active';
    this.saveToStorage();
    return { ...plant };
  }

  disablePlant(id) {
    this.checkOperatorRestriction();
    const targetId = Number(id);
    if (this.currentUser?.plant_id && targetId !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant facilities.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot modify another plant facility.' } };
      throw err;
    }

    const plant = this.plants.find((p) => p.id === targetId);
    if (!plant) throw new Error('Plant not found');
    plant.status = 'inactive';

    this.zones.filter((z) => z.plant_id === targetId).forEach((z) => {
      z.status = 'inactive';
      this.cameras.filter((c) => c.zone_id === z.id).forEach((c) => {
        c.is_active = false;
        c.status = 'offline';
      });
    });

    this.saveToStorage();
    return { ...plant };
  }

  updatePlantStatus(id, status) {
    return status === 'active' ? this.enablePlant(id) : this.disablePlant(id);
  }

  updatePlant(id, data) {
    this.checkOperatorRestriction();
    const targetId = Number(id);
    if (this.currentUser?.plant_id && targetId !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant facilities.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot update another plant facility.' } };
      throw err;
    }

    const index = this.plants.findIndex((p) => p.id === targetId);
    if (index === -1) throw new Error('Plant not found');

    const { managerOption, manager_id, new_manager, zones, ...plantFields } = data;
    this.plants[index] = { ...this.plants[index], ...plantFields, updatedAt: new Date().toISOString() };

    if (managerOption === 'existing' && manager_id) {
      this.users.filter((u) => u.plant_id === targetId && (u.role === 'manager' || u.role === 'admin')).forEach((u) => {
        u.plant_id = null;
      });
      const newAssigned = this.users.find((u) => u.id === Number(manager_id));
      if (newAssigned) {
        newAssigned.plant_id = targetId;
      }
    } else if (managerOption === 'invite' && new_manager?.email && new_manager?.name) {
      const newMgr = {
        id: Date.now() + 888,
        name: new_manager.name.trim(),
        email: new_manager.email.trim(),
        role: 'manager',
        plant_id: targetId,
        invited_by: this.currentUser.id,
        invite_status: 'pending',
        account_status: 'active',
        createdAt: new Date().toISOString(),
      };
      this.users.unshift(newMgr);
    }

    this.saveToStorage();
    return this.getPlantById(targetId);
  }

  deletePlant(id) {
    return this.disablePlant(id);
  }

  // --- ZONES ---
  getZones(plantId, page = 1, limit = 10, search = '', status = '') {
    if (plantId && this.currentUser?.plant_id && Number(plantId) !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant zones.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot view zones for another plant facility.' } };
      throw err;
    }

    let filtered = [...this.zones];

    const targetPlantId = plantId ? Number(plantId) : this.currentUser?.plant_id;
    if (targetPlantId) {
      filtered = filtered.filter((z) => z.plant_id === Number(targetPlantId));
    } else {
      filtered = [];
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((z) => z.name.toLowerCase().includes(q) || z.severity_level.toLowerCase().includes(q));
    }

    if (status) {
      filtered = filtered.filter((z) => z.status === status);
    }

    const populated = filtered.map((z) => ({
      ...z,
      plant: this.plants.find((p) => p.id === z.plant_id),
      cameras: this.cameras.filter((c) => c.zone_id === z.id),
    }));

    const total = populated.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = populated.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  getZoneById(id) {
    const zone = this.zones.find((z) => z.id === Number(id));
    if (!zone) {
      const err = new Error('Zone not found');
      err.response = { status: 404, data: { error: 'Zone not found' } };
      throw err;
    }

    if (this.currentUser?.plant_id && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant zone.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot view zone details for another plant facility.' } };
      throw err;
    }

    return {
      ...zone,
      plant: this.plants.find((p) => p.id === zone.plant_id),
      cameras: this.cameras.filter((c) => c.zone_id === zone.id),
    };
  }

  createZone(plantId, data) {
    this.checkOperatorRestriction();

    const targetPlantId = Number(plantId);
    if (this.currentUser?.plant_id && targetPlantId !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to create zone in another plant.');
      err.response = { status: 403, data: { error: 'Access denied: You can only create zones within your assigned plant facility.' } };
      throw err;
    }

    const parentPlant = this.plants.find((p) => p.id === targetPlantId);
    if (!parentPlant) {
      const err = new Error('Parent plant not found');
      err.response = { status: 404, data: { error: 'Parent plant not found' } };
      throw err;
    }

    if (parentPlant.status === 'inactive') {
      const err = new Error('Cannot add zone to an inactive plant');
      err.response = { status: 400, data: { error: 'Cannot add or enable zones inside an inactive plant.' } };
      throw err;
    }

    const newZone = {
      id: Date.now(),
      plant_id: targetPlantId,
      name: data.name,
      severity_level: data.severity_level,
      operating_schedule: data.operating_schedule || { start: '08:00', end: '20:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };

    this.zones.unshift(newZone);
    this.saveToStorage();
    return newZone;
  }

  enableZone(id) {
    this.checkOperatorRestriction();
    const zone = this.zones.find((z) => z.id === Number(id));
    if (!zone) throw new Error('Zone not found');

    if (this.currentUser?.plant_id && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot modify zones in another plant.' } };
      throw err;
    }

    const parentPlant = this.plants.find((p) => p.id === zone.plant_id);
    if (parentPlant && parentPlant.status === 'inactive') {
      const err = new Error('Parent plant is inactive');
      err.response = { status: 400, data: { error: `Cannot enable zone '${zone.name}' because its parent plant '${parentPlant.name}' is inactive.` } };
      throw err;
    }

    zone.status = 'active';
    this.saveToStorage();
    return { ...zone };
  }

  disableZone(id) {
    this.checkOperatorRestriction();
    const zone = this.zones.find((z) => z.id === Number(id));
    if (!zone) throw new Error('Zone not found');

    if (this.currentUser?.plant_id && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot modify zones in another plant.' } };
      throw err;
    }

    zone.status = 'inactive';
    this.cameras.filter((c) => c.zone_id === zone.id).forEach((c) => {
      c.is_active = false;
      c.status = 'offline';
    });

    this.saveToStorage();
    return { ...zone };
  }

  updateZoneStatus(id, status) {
    return status === 'active' ? this.enableZone(id) : this.disableZone(id);
  }

  updateZone(id, data) {
    this.checkOperatorRestriction();
    const index = this.zones.findIndex((z) => z.id === Number(id));
    if (index === -1) throw new Error('Zone not found');

    const zone = this.zones[index];
    if (this.currentUser?.plant_id && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot update zones in another plant.' } };
      throw err;
    }

    this.zones[index] = { ...this.zones[index], ...data, updatedAt: new Date().toISOString() };
    this.saveToStorage();
    return { ...this.zones[index] };
  }

  deleteZone(id) {
    return this.disableZone(id);
  }

  // --- CAMERAS ---
  getCameras(zoneId, page = 1, limit = 10, search = '', status = '', plantId = undefined) {
    if (plantId && this.currentUser?.plant_id && Number(plantId) !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant cameras.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot view cameras for another plant facility.' } };
      throw err;
    }

    let filtered = [...this.cameras];
    const targetPlantId = plantId ? Number(plantId) : this.currentUser?.plant_id;

    if (zoneId) {
      const zone = this.zones.find((z) => z.id === Number(zoneId));
      if (zone && this.currentUser?.plant_id && zone.plant_id !== Number(this.currentUser.plant_id)) {
        const err = new Error('Forbidden: Access denied.');
        err.response = { status: 403, data: { error: 'Access denied: You cannot view cameras for another plant zone.' } };
        throw err;
      }
      filtered = filtered.filter((c) => c.zone_id === Number(zoneId));
    } else if (targetPlantId) {
      const plantZoneIds = this.zones
        .filter((z) => z.plant_id === Number(targetPlantId))
        .map((z) => z.id);
      filtered = filtered.filter((c) => plantZoneIds.includes(c.zone_id));
    } else {
      filtered = [];
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) => {
        const zone = this.zones.find((z) => z.id === c.zone_id);
        const plant = zone ? this.plants.find((p) => p.id === zone.plant_id) : null;
        return (
          c.name.toLowerCase().includes(q) ||
          c.feed_type.toLowerCase().includes(q) ||
          (zone && zone.name.toLowerCase().includes(q)) ||
          (plant && plant.name.toLowerCase().includes(q))
        );
      });
    }

    if (status) {
      if (status === 'active') filtered = filtered.filter((c) => c.is_active);
      else if (status === 'inactive') filtered = filtered.filter((c) => !c.is_active);
      else filtered = filtered.filter((c) => c.status === status);
    }

    const populated = filtered.map((c) => {
      const zone = this.zones.find((z) => z.id === c.zone_id) || null;
      const plant = zone ? this.plants.find((p) => p.id === zone.plant_id) || null : null;
      return {
        ...c,
        zone,
        plant,
      };
    });

    const total = populated.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = populated.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  getCameraById(id) {
    const camera = this.cameras.find((c) => c.id === Number(id));
    if (!camera) {
      const err = new Error('Camera not found');
      err.response = { status: 404, data: { error: 'Camera not found' } };
      throw err;
    }

    const zone = this.zones.find((z) => z.id === camera.zone_id);
    if (this.currentUser?.plant_id && zone && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot view camera details for another plant facility.' } };
      throw err;
    }

    return {
      ...camera,
      zone,
    };
  }

  createCamera(zoneId, data) {
    this.checkOperatorRestriction();
    const zone = this.zones.find((z) => z.id === Number(zoneId));
    if (!zone) {
      const err = new Error('Zone not found');
      err.response = { status: 404, data: { error: 'Zone not found' } };
      throw err;
    }

    if (this.currentUser?.plant_id && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot add cameras to another plant facility.' } };
      throw err;
    }

    const plant = this.plants.find((p) => p.id === zone.plant_id);

    if (zone.status === 'inactive' || (plant && plant.status === 'inactive')) {
      const err = new Error('Parent zone or plant is inactive');
      err.response = { status: 400, data: { error: 'Cannot add or enable camera inside an inactive zone or plant.' } };
      throw err;
    }

    const newCamera = {
      id: Date.now(),
      zone_id: Number(zoneId),
      name: data.name,
      feed_type: data.feed_type,
      feed_url_or_path: data.feed_url_or_path || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      status: data.status || 'online',
      is_active: data.is_active ?? true,
      last_heartbeat_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.cameras.unshift(newCamera);
    this.saveToStorage();
    return newCamera;
  }

  enableCamera(id) {
    this.checkOperatorRestriction();
    const camera = this.cameras.find((c) => c.id === Number(id));
    if (!camera) throw new Error('Camera not found');

    const zone = this.zones.find((z) => z.id === camera.zone_id);
    if (this.currentUser?.plant_id && zone && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot modify cameras in another plant.' } };
      throw err;
    }

    const plant = zone ? this.plants.find((p) => p.id === zone.plant_id) : null;

    if (zone?.status === 'inactive' || plant?.status === 'inactive') {
      const err = new Error('Parent zone or plant is inactive');
      err.response = { status: 400, data: { error: `Cannot enable camera '${camera.name}' because its parent zone or plant is inactive.` } };
      throw err;
    }

    camera.is_active = true;
    camera.status = 'online';
    camera.last_heartbeat_at = new Date().toISOString();
    this.saveToStorage();
    return { ...camera };
  }

  disableCamera(id) {
    this.checkOperatorRestriction();
    const camera = this.cameras.find((c) => c.id === Number(id));
    if (!camera) throw new Error('Camera not found');

    const zone = this.zones.find((z) => z.id === camera.zone_id);
    if (this.currentUser?.plant_id && zone && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot modify cameras in another plant.' } };
      throw err;
    }

    camera.is_active = false;
    camera.status = 'offline';
    this.saveToStorage();
    return { ...camera };
  }

  updateCameraStatus(id, is_active) {
    return is_active ? this.enableCamera(id) : this.disableCamera(id);
  }

  updateCamera(id, data) {
    this.checkOperatorRestriction();
    const index = this.cameras.findIndex((c) => c.id === Number(id));
    if (index === -1) throw new Error('Camera not found');

    const camera = this.cameras[index];
    const zone = this.zones.find((z) => z.id === camera.zone_id);
    if (this.currentUser?.plant_id && zone && zone.plant_id !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot update cameras in another plant.' } };
      throw err;
    }

    this.cameras[index] = { ...this.cameras[index], ...data, updatedAt: new Date().toISOString() };
    this.saveToStorage();
    return { ...this.cameras[index] };
  }

  deleteCamera(id) {
    return this.disableCamera(id);
  }

  // --- TELEMETRY & ALERTS ---
  getSafetyAlerts(plantId) {
    const targetPlantId = plantId ? Number(plantId) : this.currentUser?.plant_id;
    if (targetPlantId && this.currentUser?.plant_id && targetPlantId !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied to other plant telemetry.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot view safety alerts for another plant facility.' } };
      throw err;
    }

    if (!targetPlantId) return [];
    return this.alerts.filter((a) => a.plant_id === Number(targetPlantId));
  }

  getSuperAdminMetrics(plantId) {
    const targetPlantId = plantId ? Number(plantId) : this.currentUser?.plant_id;
    if (targetPlantId && this.currentUser?.plant_id && targetPlantId !== Number(this.currentUser.plant_id)) {
      const err = new Error('Forbidden: Access denied.');
      err.response = { status: 403, data: { error: 'Access denied: You cannot view metrics for another plant facility.' } };
      throw err;
    }

    const plantCams = this.getCameras(undefined, 1, 100, '', '', targetPlantId).data;
    const online = plantCams.filter((c) => c.status === 'online' && c.is_active).length;
    return {
      ...this.metrics,
      aiFeedsOnline: online,
      aiFeedsTotal: plantCams.length || this.metrics.aiFeedsTotal,
    };
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      if (this.currentUser?.plant_id && alert.plant_id !== Number(this.currentUser.plant_id)) {
        const err = new Error('Forbidden: Access denied.');
        err.response = { status: 403, data: { error: 'Access denied: You cannot acknowledge alerts for another plant.' } };
        throw err;
      }
      alert.status = 'resolved';
      this.saveToStorage();
    }
    return { success: true };
  }

  // --- ATTENDANCE & QR ENTRY ---
  scanQRCode(qrToken, plantId = null) {
    const user = this.users.find((u) => u.qr_token === qrToken || `QR-EMP-${u.id}` === qrToken);
    if (!user) {
      const err = new Error('Invalid or unrecognized employee QR Code token');
      err.response = { status: 404, data: { error: 'Invalid or unrecognized employee QR Code token.' } };
      throw err;
    }

    if (user.account_status === 'disabled') {
      const err = new Error('Employee account is disabled');
      err.response = { status: 400, data: { error: `Employee '${user.name}' account is disabled. Entry denied.` } };
      throw err;
    }

    const targetPlantId = plantId || user.plant_id || this.currentUser?.plant_id || 1;
    const plant = this.plants.find((p) => p.id === Number(targetPlantId));
    const plantName = plant ? plant.name : `Plant #${targetPlantId}`;

    const todayStr = new Date().toISOString().split('T')[0];

    const existing = this.attendance.find(
      (a) => a.employee_id === user.id && a.entry_date === todayStr && a.plant_id === Number(targetPlantId)
    );

    if (existing) {
      const err = new Error(`Employee '${user.name}' has already checked in today at ${existing.formatted_time}.`);
      err.response = {
        status: 400,
        data: {
          error: `Employee '${user.name}' has already checked in today at ${existing.formatted_time}.`,
          alreadyCheckedIn: true,
          existingRecord: existing,
        },
      };
      throw err;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord = {
      id: Date.now(),
      employee_id: user.id,
      employee_name: user.name,
      employee_email: user.email,
      employee_role: user.role,
      qr_token: user.qr_token || qrToken,
      plant_id: Number(targetPlantId),
      plant_name: plantName,
      entry_date: todayStr,
      entry_timestamp: now.toISOString(),
      formatted_time: formattedTime,
      status: 'Checked-In',
      createdAt: now.toISOString(),
    };

    this.attendance.unshift(newRecord);
    this.saveToStorage();

    return {
      message: 'QR Code Check-In Verified',
      record: newRecord,
    };
  }

  getAttendanceLogs(page = 1, limit = 10, search = '', plantId = undefined, date = '') {
    let filtered = [...this.attendance];

    const targetPlantId = plantId ? Number(plantId) : this.currentUser?.plant_id;
    if (targetPlantId) {
      filtered = filtered.filter((a) => a.plant_id === Number(targetPlantId));
    } else {
      filtered = [];
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.employee_name.toLowerCase().includes(q) ||
          a.employee_email.toLowerCase().includes(q) ||
          a.qr_token.toLowerCase().includes(q) ||
          a.plant_name.toLowerCase().includes(q)
      );
    }

    if (date) {
      filtered = filtered.filter((a) => a.entry_date === date);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const data = filtered.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages },
    };
  }

  // --- PHASE 3: SAFETY RULES ---
  getSafetyRules(params = {}) {
    let filtered = [...this.safetyRules];
    const targetPlantId = params.plant_id || (this.currentUser?.plant_id ? String(this.currentUser.plant_id) : undefined);

    if (targetPlantId) {
      filtered = filtered.filter((r) => String(r.plant_id) === String(targetPlantId));
    }
    if (params.zone_id) {
      filtered = filtered.filter((r) => String(r.zone_id) === String(params.zone_id));
    }
    if (params.camera_id) {
      filtered = filtered.filter((r) => !r.camera_id || String(r.camera_id) === String(params.camera_id));
    }
    if (params.status) {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    return { data: filtered, count: filtered.length };
  }

  createSafetyRule(ruleData) {
    const userPlantId = this.currentUser?.plant_id;
    if (!userPlantId) {
      throw new Error('User is not assigned to any plant. Cannot create safety rule.');
    }

    const now = new Date().toISOString();
    const newRule = {
      id: Date.now(),
      name: ruleData.name || 'New Safety Rule',
      description: ruleData.description || '',
      plant_id: Number(userPlantId),
      zone_id: ruleData.zone_id ? Number(ruleData.zone_id) : null,
      camera_id: ruleData.camera_id ? Number(ruleData.camera_id) : null,
      camera_region_id: ruleData.camera_region_id ? Number(ruleData.camera_region_id) : null,
      required_ppe: ruleData.required_ppe && ruleData.required_ppe.length > 0 ? ruleData.required_ppe : ['Safety Helmet'],
      severity: ruleData.severity || 'High',
      status: ruleData.status || 'Active',
      min_observations_required: Number(ruleData.min_observations_required || 6),
      total_observation_window: Number(ruleData.total_observation_window || 10),
      frame_sampling_rate: Number(ruleData.frame_sampling_rate || 5),
      min_confidence_threshold: Number(ruleData.min_confidence_threshold || 0.75),
      cooldown_period_minutes: Number(ruleData.cooldown_period_minutes || 5),
      version: 1,
      created_by: this.currentUser?.name || 'System Admin',
      created_by_user_id: this.currentUser?.id || 1,
      createdAt: now,
      updatedAt: now,
    };
    this.safetyRules.unshift(newRule);
    this.saveToStorage();
    return { message: 'Safety rule created successfully', rule: newRule };
  }

  updateSafetyRule(id, updates) {
    const idx = this.safetyRules.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) throw new Error('Safety rule not found');

    const current = this.safetyRules[idx];
    const updated = {
      ...current,
      ...updates,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.safetyRules[idx] = updated;
    this.saveToStorage();
    return { message: 'Safety rule updated successfully', rule: updated };
  }

  toggleSafetyRuleStatus(id) {
    const idx = this.safetyRules.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) throw new Error('Safety rule not found');

    const current = this.safetyRules[idx];
    current.status = current.status === 'Active' ? 'Inactive' : 'Active';
    current.updatedAt = new Date().toISOString();
    this.safetyRules[idx] = current;
    this.saveToStorage();
    return { message: `Safety rule marked as ${current.status}`, rule: current };
  }

  // --- PHASE 3: CAMERA REGIONS ---
  getCameraRegions(params = {}) {
    let filtered = [...this.cameraRegions];
    const targetPlantId = params.plant_id || (this.currentUser?.plant_id ? String(this.currentUser.plant_id) : undefined);

    if (targetPlantId) {
      filtered = filtered.filter((r) => String(r.plant_id) === String(targetPlantId));
    }
    if (params.camera_id) {
      filtered = filtered.filter((r) => String(r.camera_id) === String(params.camera_id));
    }
    if (params.status) {
      filtered = filtered.filter((r) => r.status === params.status);
    }
    return { data: filtered, count: filtered.length };
  }

  createCameraRegion(regionData) {
    if (!regionData.polygon_points || !Array.isArray(regionData.polygon_points) || regionData.polygon_points.length < 3) {
      throw new Error('Polygon region must contain at least 3 distinct vertices');
    }
    const now = new Date().toISOString();
    const newRegion = {
      id: Date.now(),
      name: regionData.name || 'Monitored Region',
      description: regionData.description || '',
      plant_id: Number(regionData.plant_id || 1),
      zone_id: regionData.zone_id ? Number(regionData.zone_id) : null,
      camera_id: Number(regionData.camera_id || 1),
      safety_rule_ids: regionData.safety_rule_ids || [],
      polygon_points: regionData.polygon_points,
      original_canvas_width: Number(regionData.original_canvas_width || 1280),
      original_canvas_height: Number(regionData.original_canvas_height || 720),
      status: regionData.status || 'Active',
      created_by: this.currentUser?.name || 'System Admin',
      createdAt: now,
      updatedAt: now,
    };
    this.cameraRegions.unshift(newRegion);
    this.saveToStorage();
    return { message: 'Camera region created successfully', region: newRegion };
  }

  updateCameraRegion(id, updates) {
    const idx = this.cameraRegions.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) throw new Error('Camera region not found');

    const current = this.cameraRegions[idx];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.cameraRegions[idx] = updated;
    this.saveToStorage();
    return { message: 'Camera region updated successfully', region: updated };
  }

  // --- PHASE 3: CCTV VIDEOS ---
  getCCTVVideos(params = {}) {
    let filtered = [...this.cctvVideos];
    const targetPlantId = params.plant_id || (this.currentUser?.plant_id ? String(this.currentUser.plant_id) : undefined);

    if (targetPlantId) {
      filtered = filtered.filter((v) => String(v.plant_id) === String(targetPlantId));
    }
    if (params.camera_id) {
      filtered = filtered.filter((v) => String(v.camera_id) === String(params.camera_id));
    }
    return { data: filtered, count: filtered.length };
  }

  uploadCCTVVideo(videoData) {
    const now = new Date().toISOString();
    const file = videoData.file || {};
    const filename = videoData.original_name || file.name || `cctv_clip_${Date.now()}.mp4`;

    const newVideo = {
      id: Date.now(),
      filename: filename,
      original_name: filename,
      file_path: `/uploads/videos/${filename}`,
      file_size_bytes: file.size || videoData.file_size_bytes || 45200100,
      duration_seconds: videoData.duration_seconds || 180,
      width: videoData.width || 1920,
      height: videoData.height || 1080,
      fps: videoData.fps || 30,
      mime_type: 'video/mp4',
      plant_id: Number(videoData.plant_id || this.currentUser?.plant_id || 1),
      zone_id: videoData.zone_id ? Number(videoData.zone_id) : 1,
      camera_id: Number(videoData.camera_id || 1),
      uploader_user_id: this.currentUser?.id || 1,
      uploader_name: this.currentUser?.name || 'System Admin',
      status: 'Ready',
      createdAt: now,
      updatedAt: now,
    };
    this.cctvVideos.unshift(newVideo);
    this.saveToStorage();
    return { message: 'CCTV video uploaded & validated successfully', video: newVideo };
  }

  // --- PHASE 3: VIDEO PROCESSING JOBS ---
  getVideoJobs(params = {}) {
    let filtered = [...this.videoJobs];
    const targetPlantId = params.plant_id || (this.currentUser?.plant_id ? String(this.currentUser.plant_id) : undefined);

    if (targetPlantId) {
      filtered = filtered.filter((j) => String(j.plant_id) === String(targetPlantId));
    }
    if (params.status) {
      filtered = filtered.filter((j) => j.status === params.status);
    }
    return { data: filtered, count: filtered.length };
  }

  startVideoJob({ video_id, camera_id, rule_ids, region_ids }) {
    const video = this.cctvVideos.find((v) => String(v.id) === String(video_id));
    if (!video) throw new Error('Selected CCTV Video not found');

    const activeRules = this.safetyRules.filter(
      (r) => r.status === 'Active' && (!rule_ids || rule_ids.includes(r.id)) && String(r.plant_id) === String(video.plant_id)
    );
    const activeRegions = this.cameraRegions.filter(
      (rg) => rg.status === 'Active' && (!region_ids || region_ids.includes(rg.id)) && String(rg.camera_id) === String(video.camera_id)
    );

    const now = new Date();
    const jobId = Date.now();

    const newJob = {
      id: jobId,
      job_code: `JOB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(jobId).slice(-4)}`,
      video_id: Number(video_id),
      plant_id: video.plant_id,
      zone_id: video.zone_id,
      camera_id: Number(camera_id || video.camera_id),
      status: 'Processing',
      progress_percent: 25,
      rules_snapshot: activeRules,
      regions_snapshot: activeRegions,
      total_frames: Math.floor(video.duration_seconds * video.fps),
      processed_frames: Math.floor((video.duration_seconds * video.fps) * 0.25),
      detected_observations_count: 0,
      confirmed_violations_count: 0,
      created_incidents_count: 0,
      started_at: now.toISOString(),
      completed_at: null,
      error_message: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.videoJobs.unshift(newJob);
    this.saveToStorage();

    // Execute Computer Vision detection simulation & persistence verification pipeline
    this.runJobInferencePipeline(newJob, video, activeRules, activeRegions);

    return { message: 'Video processing job started in background', job: newJob };
  }

  runJobInferencePipeline(job, video, rules, regions) {
    // Generate AI observations for missing PPE
    const candidateEvents = [];
    const createdIncidents = [];
    const targetRule = rules[0] || {
      id: 101,
      name: 'Assembly Line PPE Compliance',
      required_ppe: ['helmet', 'safety_vest'],
      severity: 'High',
      min_observations_required: 6,
      total_observation_window: 10,
      cooldown_period_minutes: 5,
    };

    const targetRegion = regions[0] || {
      id: 201,
      name: 'Machinery Zone Alpha',
      polygon_points: [{ x: 0.1, y: 0.2 }, { x: 0.9, y: 0.2 }, { x: 0.9, y: 0.8 }, { x: 0.1, y: 0.8 }],
    };

    // Generate observations across sampled frames
    const totalSampledFrames = 10;
    const positiveObservationsCount = 8; // Meets persistence threshold (8 out of 10)

    for (let i = 1; i <= totalSampledFrames; i++) {
      const isPositive = i <= positiveObservationsCount;
      const timestampSec = (video.duration_seconds / totalSampledFrames) * i;

      const event = {
        id: Date.now() + i,
        job_id: job.id,
        camera_id: video.camera_id,
        camera_region_id: targetRegion.id,
        rule_id: targetRule.id,
        violation_category: 'Missing Helmet & Safety Vest',
        severity: targetRule.severity || 'High',
        confidence_score: isPositive ? 0.92 : 0.45,
        video_timestamp_seconds: Number(timestampSec.toFixed(2)),
        frame_number: i * 30,
        bounding_box: { x_min: 0.35, y_min: 0.25, width: 0.18, height: 0.45 },
        is_inside_region: true,
        is_confirmed: isPositive,
        observation_index: i,
        total_window: totalSampledFrames,
        createdAt: new Date().toISOString(),
      };
      candidateEvents.push(event);
      this.detectionEvents.unshift(event);
    }

    // Evaluate Persistence Verification: 8 observations >= min 6 required
    const persistentConfirmed = positiveObservationsCount >= targetRule.min_observations_required;

    if (persistentConfirmed) {
      // Cooldown check for duplicate incident prevention
      const cooldownMs = (targetRule.cooldown_period_minutes || 5) * 60 * 1000;
      const recentExisting = this.incidents.find(
        (inc) =>
          inc.camera_id === video.camera_id &&
          inc.violation_category === 'Missing Helmet & Safety Vest' &&
          new Date() - new Date(inc.createdAt) < cooldownMs
      );

      if (!recentExisting) {
        const newIncident = {
          id: `INC-2026-${String(Date.now()).slice(-4)}`,
          plant_id: video.plant_id,
          zone_id: video.zone_id,
          camera_id: video.camera_id,
          camera_region_id: targetRegion.id,
          job_id: job.id,
          rule_id: targetRule.id,
          title: `PPE Safety Violation: Missing Helmet & Safety Vest`,
          description: `Confirmed persistent PPE safety violation detected in ${targetRegion.name}. Observed missing helmet/vest across ${positiveObservationsCount}/${totalSampledFrames} sampled frames.`,
          violation_category: 'Missing Helmet & Safety Vest',
          severity: targetRule.severity || 'High',
          status: 'Open',
          confidence_score: 0.94,
          first_observed_timestamp: candidateEvents[0].video_timestamp_seconds,
          last_observed_timestamp: candidateEvents[positiveObservationsCount - 1].video_timestamp_seconds,
          evidence_video_url: video.file_path,
          evidence_metadata: {
            job_id: job.id,
            sampled_observations: positiveObservationsCount,
            window_size: totalSampledFrames,
            rule_name: targetRule.name,
            region_name: targetRegion.name,
          },
          assigned_reviewer: 'Unassigned',
          reviewed_by: null,
          reviewed_at: null,
          review_notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        createdIncidents.push(newIncident);
        this.incidents.unshift(newIncident);
      }
    }

    // Finish job status update
    job.status = 'Completed';
    job.progress_percent = 100;
    job.processed_frames = job.total_frames;
    job.detected_observations_count = candidateEvents.length;
    job.confirmed_violations_count = positiveObservationsCount;
    job.created_incidents_count = createdIncidents.length;
    job.completed_at = new Date().toISOString();
    job.updatedAt = new Date().toISOString();

    this.saveToStorage();
  }

  // --- PHASE 3: DETECTION EVENTS ---
  getDetectionEvents(params = {}) {
    let filtered = [...this.detectionEvents];
    if (params.job_id) {
      filtered = filtered.filter((e) => String(e.job_id) === String(params.job_id));
    }
    if (params.camera_id) {
      filtered = filtered.filter((e) => String(e.camera_id) === String(params.camera_id));
    }
    if (params.is_confirmed !== undefined) {
      const isConf = String(params.is_confirmed) === 'true';
      filtered = filtered.filter((e) => e.is_confirmed === isConf);
    }
    return { data: filtered, count: filtered.length };
  }

  // --- PHASE 3: INCIDENTS ---
  getIncidents(params = {}) {
    let filtered = [...this.incidents];
    const targetPlantId = params.plant_id || (this.currentUser?.plant_id ? String(this.currentUser.plant_id) : undefined);

    if (targetPlantId) {
      filtered = filtered.filter((inc) => String(inc.plant_id) === String(targetPlantId));
    }
    if (params.zone_id) {
      filtered = filtered.filter((inc) => String(inc.zone_id) === String(params.zone_id));
    }
    if (params.camera_id) {
      filtered = filtered.filter((inc) => String(inc.camera_id) === String(params.camera_id));
    }
    if (params.severity) {
      filtered = filtered.filter((inc) => inc.severity === params.severity);
    }
    if (params.status) {
      filtered = filtered.filter((inc) => inc.status === params.status);
    }
    if (params.category) {
      filtered = filtered.filter((inc) => inc.violation_category === params.category);
    }
    return { data: filtered, count: filtered.length };
  }

  getIncidentById(id) {
    const incident = this.incidents.find((inc) => String(inc.id) === String(id));
    if (!incident) throw new Error('Incident record not found');

    const relatedEvents = this.detectionEvents.filter((e) => String(e.job_id) === String(incident.job_id));
    const video = this.cctvVideos.find((v) => String(v.camera_id) === String(incident.camera_id));

    return {
      incident,
      events: relatedEvents,
      video: video || { file_path: '/uploads/videos/assembly_line_cctv.mp4', filename: 'assembly_line_cctv.mp4' },
    };
  }

  updateIncidentStatus(id, { status, notes }) {
    const idx = this.incidents.findIndex((inc) => String(inc.id) === String(id));
    if (idx === -1) throw new Error('Incident not found');

    const current = this.incidents[idx];
    current.status = status || current.status;
    current.review_notes = notes || current.review_notes;
    current.reviewed_by = this.currentUser?.name || 'Authorized Admin';
    current.reviewed_at = new Date().toISOString();
    current.updatedAt = new Date().toISOString();

    this.incidents[idx] = current;
    this.saveToStorage();
    return { message: `Incident updated to ${current.status}`, incident: current };
  }
}

export const mockEngine = new MockEngine();
