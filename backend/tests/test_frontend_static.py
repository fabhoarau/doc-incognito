"""Static serving of the built frontend (Docker image path).

create_app() mounts frontend/dist at / only when the directory exists; API
routers are registered first, so /api always wins over the static mount.
"""

from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import create_app


def test_index_served_when_dist_exists(tmp_path, monkeypatch):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text("<html>doc-incognito</html>")
    (dist / "logo.svg").write_text("<svg/>")
    monkeypatch.setattr(settings, "frontend_dist", dist)

    client = TestClient(create_app())
    r = client.get("/")
    assert r.status_code == 200
    assert "doc-incognito" in r.text
    # static assets are served too
    assert client.get("/logo.svg").status_code == 200


def test_api_routes_win_over_static_mount(tmp_path, monkeypatch):
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text("<html>ui</html>")
    monkeypatch.setattr(settings, "frontend_dist", dist)

    client = TestClient(create_app())
    # /api/docs must reach FastAPI docs, not the static mount
    assert client.get("/api/docs").status_code == 200
    # unknown API-ish path still 404s from the router, not index.html
    assert client.get("/api/nope").status_code == 404


def test_no_mount_when_dist_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "frontend_dist", tmp_path / "does-not-exist")
    client = TestClient(create_app())
    r = client.get("/")
    assert r.status_code == 404
    # API still works
    assert client.get("/api/docs").status_code == 200


def test_real_repo_dist_mounts_if_built():
    # When `npm run build` has run in the repo, the default path is a real dir
    # and the app serves it; otherwise it is skipped. Either way the app works.
    client = TestClient(create_app())
    r = client.get("/api/docs")
    assert r.status_code == 200
    root = client.get("/")
    if Path(settings.frontend_dist).is_dir():
        assert root.status_code == 200
    else:
        assert root.status_code == 404
