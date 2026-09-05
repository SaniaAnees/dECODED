/** First name for welcome copy — prefers OAuth name, falls back to email local part. */
export function displayNameFromUser(user: {
  name?: string | null;
  email?: string | null;
}): string {
  const fromName = user.name?.trim().split(/\s+/)[0];
  if (fromName) return titleCase(fromName);

  const local = user.email?.split("@")[0]?.trim();
  if (local) {
    const segment = local.split(/[._+-]/)[0] ?? local;
    return titleCase(segment);
  }

  return "there";
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
