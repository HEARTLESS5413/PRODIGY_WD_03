function resolveId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  return null;
}

export function mapUserSummary(user) {
  if (!user) {
    return null;
  }

  return {
    id: resolveId(user._id || user.id),
    username: user.username,
  };
}

export function mapFriendRequest(request) {
  return {
    createdAt: request.createdAt,
    from: mapUserSummary(request.from),
  };
}

export function mapProfile(user) {
  return {
    id: resolveId(user._id || user.id),
    username: user.username,
    friends: (user.friends || []).map((friend) => mapUserSummary(friend)).filter(Boolean),
    friendRequests: (user.friendRequests || []).map((request) => mapFriendRequest(request)),
  };
}

