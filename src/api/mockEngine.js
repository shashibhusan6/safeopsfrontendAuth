import { INITIAL_USERS, INITIAL_PLANTS, INITIAL_ZONES, INITIAL_CAMERAS } from './mockData.js';

class MockEngine {
  constructor() {
    this.users = [...INITIAL_USERS];
    this.plants = [...INITIAL_PLANTS];
    this.zones = [...INITIAL_ZONES];
    this.cameras = [...INITIAL_CAMERAS];

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
      if (u) this.users = JSON.parse(u);
      if (p) this.plants = JSON.parse(p);
      if (z) this.zones = JSON.parse(z);
      if (c) this.cameras = JSON.parse(c);
    } catch {
      // fallback
    }
  }

  setSimulatedRole(role) {
    this.activeRole = role;
    const found = this.users.find((u) => u.role === role);
    if (found) {
      this.currentUser = { ...found };
    } else {
      this.currentUser = {
        id: 999,
        name: `Demo ${role.toUpperCase()}`,
        email: `${role}@safeops.io`,
        role: role,
        plant_id: role === 'super_admin' ? null : 1,
        invite_status: 'accepted',
        account_status: 'active',
      };
    }
  }

  getCurrentUser() {
    return { ...this.currentUser, role: this.activeRole };
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

    return {
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
      user: { ...user },
    };
  }

  me() {
    if (this.currentUser.account_status === 'disabled') {
      const err = new Error('Account is disabled');
      err.response = { status: 401, data: { error: 'Account is disabled' } };
      throw err;
    }
    return { user: { ...this.currentUser } };
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

    if (this.activeRole !== 'super_admin' && this.currentUser.plant_id) {
      filtered = filtered.filter((p) => p.id === this.currentUser.plant_id);
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
    const plant = this.plants.find((p) => p.id === id);
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

  createPlant(data) {
    this.checkOperatorRestriction();
    if (this.activeRole !== 'super_admin') {
      const err = new Error('Forbidden: Only super_admin can create plants.');
      err.response = { status: 403, data: { error: 'Only super_admin can create new plants.' } };
      throw err;
    }

    const newPlantId = Date.now();
    const newPlant = {
      id: newPlantId,
      name: data.name,
      address: data.address,
      timezone: data.timezone,
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
    };

    this.plants.unshift(newPlant);

    // Process nested Zones & Cameras
    if (Array.isArray(data.zones) && data.zones.length > 0) {
      data.zones.forEach((z, zIdx) => {
        const zoneName = z.name && z.name.trim() ? z.name.trim() : `Zone ${zIdx + 1}`;
        const zoneId = Date.now() + zIdx + 1;
        const newZone = {
          id: zoneId,
          plant_id: newPlantId,
          name: zoneName,
          severity_level: z.severity_level || 'medium',
          operating_schedule: z.operating_schedule || { start: '08:00', end: '20:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        this.zones.unshift(newZone);

        if (Array.isArray(z.cameras) && z.cameras.length > 0) {
          z.cameras.forEach((c, cIdx) => {
            const camName = c.name && c.name.trim() ? c.name.trim() : `Camera ${cIdx + 1}`;
            const newCamera = {
              id: Date.now() + (zIdx + 1) * 100 + cIdx + 1,
              zone_id: zoneId,
              name: camName,
              feed_type: c.feed_type || 'simulated',
              feed_url_or_path: c.feed_url_or_path || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
              status: 'online',
              is_active: true,
              last_heartbeat_at: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            this.cameras.unshift(newCamera);
          });
        }
      });
    }

    // Process Plant Manager Assignment / Invitation
    if (data.managerOption === 'existing' && data.manager_id) {
      const existingMgr = this.users.find((u) => u.id === Number(data.manager_id));
      if (existingMgr) {
        existingMgr.plant_id = newPlantId;
      }
    } else if (data.managerOption === 'invite' && data.new_manager?.email && data.new_manager?.name) {
      const newMgr = {
        id: Date.now() + 888,
        name: data.new_manager.name.trim(),
        email: data.new_manager.email.trim(),
        role: 'manager',
        plant_id: newPlantId,
        invited_by: this.currentUser.id,
        invite_status: 'pending',
        account_status: 'active',
        createdAt: new Date().toISOString(),
      };
      this.users.unshift(newMgr);
    }

    this.saveToStorage();
    return this.getPlantById(newPlantId);
  }

  enablePlant(id) {
    this.checkOperatorRestriction();
    if (this.activeRole !== 'super_admin') {
      const err = new Error('Forbidden: Only super_admin can modify plants.');
      err.response = { status: 403, data: { error: 'Only super_admin can enable or disable plants.' } };
      throw err;
    }

    const plant = this.plants.find((p) => p.id === id);
    if (!plant) throw new Error('Plant not found');
    plant.status = 'active';
    this.saveToStorage();
    return { ...plant };
  }

  disablePlant(id) {
    this.checkOperatorRestriction();
    if (this.activeRole !== 'super_admin') {
      const err = new Error('Forbidden: Only super_admin can modify plants.');
      err.response = { status: 403, data: { error: 'Only super_admin can enable or disable plants.' } };
      throw err;
    }

    const plant = this.plants.find((p) => p.id === id);
    if (!plant) throw new Error('Plant not found');
    plant.status = 'inactive';

    this.zones.filter((z) => z.plant_id === id).forEach((z) => {
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
    const index = this.plants.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Plant not found');

    const { managerOption, manager_id, new_manager, zones, ...plantFields } = data;
    this.plants[index] = { ...this.plants[index], ...plantFields, updatedAt: new Date().toISOString() };

    if (managerOption === 'existing' && manager_id) {
      // Unassign existing managers for this plant
      this.users.filter((u) => u.plant_id === id && (u.role === 'manager' || u.role === 'admin')).forEach((u) => {
        u.plant_id = null;
      });
      const newAssigned = this.users.find((u) => u.id === Number(manager_id));
      if (newAssigned) {
        newAssigned.plant_id = id;
      }
    } else if (managerOption === 'invite' && new_manager?.email && new_manager?.name) {
      const newMgr = {
        id: Date.now() + 888,
        name: new_manager.name.trim(),
        email: new_manager.email.trim(),
        role: 'manager',
        plant_id: id,
        invited_by: this.currentUser.id,
        invite_status: 'pending',
        account_status: 'active',
        createdAt: new Date().toISOString(),
      };
      this.users.unshift(newMgr);
    }

    this.saveToStorage();
    return this.getPlantById(id);
  }

  deletePlant(id) {
    return this.disablePlant(id);
  }

  // --- ZONES ---
  getZones(plantId, page = 1, limit = 10, search = '', status = '') {
    let filtered = [...this.zones];

    if (plantId) {
      filtered = filtered.filter((z) => z.plant_id === plantId);
    } else if (this.activeRole !== 'super_admin' && this.currentUser.plant_id) {
      filtered = filtered.filter((z) => z.plant_id === this.currentUser.plant_id);
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
    const zone = this.zones.find((z) => z.id === id);
    if (!zone) {
      const err = new Error('Zone not found');
      err.response = { status: 404, data: { error: 'Zone not found' } };
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

    const parentPlant = this.plants.find((p) => p.id === plantId);
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
      plant_id: plantId,
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
    const zone = this.zones.find((z) => z.id === id);
    if (!zone) throw new Error('Zone not found');

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
    const zone = this.zones.find((z) => z.id === id);
    if (!zone) throw new Error('Zone not found');

    zone.status = 'inactive';
    this.cameras.filter((c) => c.zone_id === id).forEach((c) => {
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
    const index = this.zones.findIndex((z) => z.id === id);
    if (index === -1) throw new Error('Zone not found');

    this.zones[index] = { ...this.zones[index], ...data, updatedAt: new Date().toISOString() };
    this.saveToStorage();
    return { ...this.zones[index] };
  }

  deleteZone(id) {
    return this.disableZone(id);
  }

  // --- CAMERAS ---
  getCameras(zoneId, page = 1, limit = 10, search = '', status = '', plantId = undefined) {
    let filtered = [...this.cameras];

    if (zoneId) {
      filtered = filtered.filter((c) => c.zone_id === Number(zoneId));
    } else if (plantId) {
      const plantZoneIds = this.zones
        .filter((z) => z.plant_id === Number(plantId))
        .map((z) => z.id);
      filtered = filtered.filter((c) => plantZoneIds.includes(c.zone_id));
    } else if (this.activeRole !== 'super_admin' && this.currentUser.plant_id) {
      const plantZoneIds = this.zones
        .filter((z) => z.plant_id === this.currentUser.plant_id)
        .map((z) => z.id);
      filtered = filtered.filter((c) => plantZoneIds.includes(c.zone_id));
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
    const camera = this.cameras.find((c) => c.id === id);
    if (!camera) {
      const err = new Error('Camera not found');
      err.response = { status: 404, data: { error: 'Camera not found' } };
      throw err;
    }
    return {
      ...camera,
      zone: this.zones.find((z) => z.id === camera.zone_id),
    };
  }

  createCamera(zoneId, data) {
    this.checkOperatorRestriction();
    const zone = this.zones.find((z) => z.id === zoneId);
    if (!zone) {
      const err = new Error('Zone not found');
      err.response = { status: 404, data: { error: 'Zone not found' } };
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
      zone_id: zoneId,
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
    const camera = this.cameras.find((c) => c.id === id);
    if (!camera) throw new Error('Camera not found');

    const zone = this.zones.find((z) => z.id === camera.zone_id);
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
    const camera = this.cameras.find((c) => c.id === id);
    if (!camera) throw new Error('Camera not found');

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
    const index = this.cameras.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Camera not found');

    this.cameras[index] = { ...this.cameras[index], ...data, updatedAt: new Date().toISOString() };
    this.saveToStorage();
    return { ...this.cameras[index] };
  }

  deleteCamera(id) {
    return this.disableCamera(id);
  }
}

export const mockEngine = new MockEngine();
