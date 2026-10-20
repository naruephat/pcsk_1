export async function fetchTeachers() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/teachers`);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }
    return { data: await res.json(), isSupabase: false };
  } catch (error) {
    return {
      data: [],
      isSupabase: false,
      error: error instanceof Error ? error.message : 'Unknown MySQL fetch error',
    };
  }
}

export async function fetchPlans() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/plans`);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }
    return { data: await res.json(), isSupabase: false };
  } catch (error) {
    return {
      data: [],
      isSupabase: false,
      error: error instanceof Error ? error.message : 'Unknown MySQL fetch error',
    };
  }
}

export async function savePlanRecord(plan: any) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return { success: true, isSupabase: false };
  } catch (error) {
    return {
      success: false,
      isSupabase: false,
      error: error instanceof Error ? error.message : 'Unknown MySQL save error',
    };
  }
}

export async function saveTeacherRecord(teacher: any) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return { success: true, isSupabase: false };
  } catch (error) {
    return {
      success: false,
      isSupabase: false,
      error: error instanceof Error ? error.message : 'Unknown MySQL save error',
    };
  }
}
