export function getEntityId(entity) {
  return entity?.id || entity?._id || entity?.slug;
}
