from math import ceil


def pagination_params(args, default_page_size=20, max_page_size=100):
    try:
        page = int(args.get("page", 1))
    except (TypeError, ValueError):
        page = 1

    try:
        page_size = int(args.get("page_size", default_page_size))
    except (TypeError, ValueError):
        page_size = default_page_size

    page = max(page, 1)
    page_size = min(max(page_size, 1), max_page_size)
    offset = (page - 1) * page_size
    return page, page_size, offset


def pagination_meta(page, page_size, total):
    total_pages = ceil(total / page_size) if total else 0
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }
