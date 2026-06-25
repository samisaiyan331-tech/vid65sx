const fs = require('fs');
const path = require('path');

// Update this domain to your live site domain if needed.
const DOMAIN = process.env.SITE_DOMAIN || 'https://vid65s.gt.tc';
const ROOT_DIR = __dirname;
const OUTPUT_FILE = path.join(ROOT_DIR, 'sitemap.xml');
const DATA_FILE = path.join(ROOT_DIR, 'data.json');

function formatDate(date) {
    if (!date) return new Date().toISOString().split('T')[0];
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
}

function escapeUrl(url) {
    return url.replace(/&/g, '&amp;');
}

function readJson(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error('Unable to parse JSON file:', filePath, error.message);
        return null;
    }
}

function collectHtmlFiles(directory) {
    return fs.readdirSync(directory)
        .filter(file => file.endsWith('.html'))
        .filter(file => file !== 'sitemap.xml' && file !== 'sitemap.xml' && file !== 'package.json' && file !== 'generate-sitemap.js')
        .sort();
}

function buildUrlEntries(htmlFiles, posts) {
    const now = new Date().toISOString().split('T')[0];
    const entries = [];

    htmlFiles.forEach(file => {
        const filePath = path.join(ROOT_DIR, file);
        let lastmod = now;
        try {
            const stats = fs.statSync(filePath);
            lastmod = formatDate(stats.mtime.toISOString());
        } catch (error) {
            // ignore filesystem date errors and keep now
        }

        entries.push({
            loc: `${DOMAIN}/${file}`,
            lastmod,
            changefreq: 'daily',
            priority: file === 'index.html' ? '1.00' : '0.80'
        });
    });

    if (posts && Array.isArray(posts)) {
        posts.forEach(post => {
            if (!post || !post.id) return;
            entries.push({
                loc: `${DOMAIN}/watch.html?id=${encodeURIComponent(post.id)}`,
                lastmod: formatDate(post.date),
                changefreq: 'weekly',
                priority: '0.70'
            });
        });
    }

    return entries;
}

function renderSitemap(entries) {
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];

    entries.forEach(entry => {
        xml.push('  <url>');
        xml.push(`    <loc>${escapeUrl(entry.loc)}</loc>`);
        xml.push(`    <lastmod>${entry.lastmod}</lastmod>`);
        xml.push(`    <changefreq>${entry.changefreq}</changefreq>`);
        xml.push(`    <priority>${entry.priority}</priority>`);
        xml.push('  </url>');
    });

    xml.push('</urlset>');
    return xml.join('\n') + '\n';
}

function run() {
    console.log('Generating sitemap.xml using pure Node.js...');

    const htmlFiles = collectHtmlFiles(ROOT_DIR);
    const posts = readJson(DATA_FILE);

    if (!htmlFiles.length) {
        console.warn('No HTML files found in root directory. Aborting sitemap generation.');
        return;
    }

    const entries = buildUrlEntries(htmlFiles, posts);
    const sitemapXml = renderSitemap(entries);

    fs.writeFileSync(OUTPUT_FILE, sitemapXml, 'utf8');
    console.log(`Created ${OUTPUT_FILE} with ${entries.length} URLs from ${htmlFiles.length} HTML files and ${posts ? posts.length : 0} posts.`);
    console.log('Sitemap generation completed without modifying any existing page code.');
}

run();
