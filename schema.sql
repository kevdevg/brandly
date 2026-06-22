-- PostgreSQL Schema for SaaS Branding Automation (Design MD)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Empresas (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuarios de la plataforma (Vinculados a empresas)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'editor', 'viewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Design MD (Sistema de diseño estricto)
-- Almacena las "máscaras" y variables programáticas de cada marca.
CREATE TABLE design_md (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
    text_color VARCHAR(7) DEFAULT '#FFFFFF',
    base_font VARCHAR(100) DEFAULT 'Inter',
    logo_url TEXT,
    frame_thickness INTEGER DEFAULT 12,
    watermark_opacity DECIMAL(3,2) DEFAULT 1.0,
    guidelines_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Activos/Proyectos (Raw files y renders)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'raw_video', 'rendered_video'
    target_platform VARCHAR(50), -- 'tiktok', 'reels', 'facebook'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
