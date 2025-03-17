export function generateUserId(): string {
    const id = Math.random().toString(36).substring(2, 15);
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("userId", id);
      } catch (error) {
        console.error("Ошибка при сохранении userId в localStorage:", error);
      }
    }
    return id;
  }