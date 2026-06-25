/**
 * VID65 Share - Build Generation Script (Pure Node.js)
 * Automatically compiles static SEO pages for individual posts and outputs sitemap.xml.
 */

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://vid65sx.netlify.app';

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

function runBuildGenerator() {
    try {
        console.log("Starting Build Generation sequence...");

        const dbPath = path.join(__dirname, 'data.json');
        const watchTemplatePath = path.join(__dirname, 'watch.html');

        if (!fs.existsSync(dbPath) || !fs.existsSync(watchTemplatePath)) {
            throw new Error("Missing data.json or watch.html template files.");
        }

        const rawData = fs.readFileSync(dbPath, 'utf8');
        const posts = JSON.parse(rawData);
        const watchTemplate = fs.readFileSync(watchTemplatePath, 'utf8');

        // Initial XML Sitemap template setup
        let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Add standard core static pages to XML sitemap
        const corePages = ['index.html', 'about.html', 'contact.html', 'sitemap.html'];
        const todayDate = new Date().toISOString().split('T')[0];
        
        corePages.forEach(page => {
            sitemapXml += `  <url>\n`;
            sitemapXml += `    <loc>${DOMAIN}/${page}</loc>\n`;
            sitemapXml += `    <lastmod>${todayDate}</lastmod>\n`;
            sitemapXml += `    <changefreq>daily</changefreq>\n`;
            sitemapXml += `    <priority>0.80</priority>\n`;
            sitemapXml += `  </url>\n`;
        });

        console.log(`Generating ${posts.length} dynamic static post pages for SEO...`);

        // Loop posts to output static HTML files and sitemap nodes
        posts.forEach(post => {
            const fileName = `${post.id}.html`;
            const fileOutPath = path.join(__dirname, fileName);

            // Replace Meta properties dynamically inside the watch.html blueprint
            let outputHtml = watchTemplate;

            // Replacing Document Title
            outputHtml = outputHtml.replace(/<title>.*?<\/title>/, `<title>${escapeHTML(post.title)} - VID65 Share</title>`);

            // Replacing Meta Descriptions
            outputHtml = outputHtml.replace(/id="metaDesc" name="description" content=".*?"/, `id="metaDesc" name="description" content="${escapeHTML(post.description)}"`);
            outputHtml = outputHtml.replace(/id="metaOgDesc" property="og:description" content=".*?"/, `id="metaOgDesc" property="og:description" content="${escapeHTML(post.description)}"`);

            // Replacing OpenGraph Titles
            outputHtml = outputHtml.replace(/id="metaOgTitle" property="og:title" content=".*?"/, `id="metaOgTitle" property="og:title" content="${escapeHTML(post.title)} - VID65 Share"`);

            // Replacing Meta Images (Thumbnail)
            outputHtml = outputHtml.replace(/id="metaOgImage" property="og:image" content=".*?"/, `id="metaOgImage" property="og:image" content="${escapeHTML(post.thumbnail)}"`);
            outputHtml = outputHtml.replace(/id="metaOgImageSecure" property="og:image:secure_url" content=".*?"/, `id="metaOgImageSecure" property="og:image:secure_url" content="${escapeHTML(post.thumbnail)}"`);
            outputHtml = outputHtml.replace(/id="metaOgImageAlt" property="og:image:alt" content=".*?"/, `id="metaOgImageAlt" property="og:image:alt" content="${escapeHTML(`Watch ${post.title} on VID65 Share`)}"`);
            outputHtml = outputHtml.replace(/id="linkCanonical" rel="canonical" href=".*?"/, `id="linkCanonical" rel="canonical" href="${DOMAIN}/${escapeHTML(post.id)}.html"`);
            outputHtml = outputHtml.replace(/id="linkImageSrc" rel="image_src" href=".*?"/, `id="linkImageSrc" rel="image_src" href="${escapeHTML(post.thumbnail)}"`);
            outputHtml = outputHtml.replace(/id="metaOgUrl" property="og:url" content=".*?"/, `id="metaOgUrl" property="og:url" content="${DOMAIN}/${escapeHTML(post.id)}.html"`);
            outputHtml = outputHtml.replace(/property="twitter:url" content=".*?"/, `property="twitter:url" content="${DOMAIN}/${escapeHTML(post.id)}.html"`);
            outputHtml = outputHtml.replace(/property="twitter:title" content=".*?"/, `property="twitter:title" content="${escapeHTML(post.title)} - VID65 Share"`);
            outputHtml = outputHtml.replace(/property="twitter:description" content=".*?"/, `property="twitter:description" content="${escapeHTML(post.description)}"`);
            outputHtml = outputHtml.replace(/property="twitter:image" content=".*?"/, `property="twitter:image" content="${escapeHTML(post.thumbnail)}"`);
            outputHtml = outputHtml.replace(/property="twitter:image:alt" content=".*?"/, `property="twitter:image:alt" content="${escapeHTML(`Watch ${post.title} on VID65 Share`)}"`);
            outputHtml = outputHtml.replace(/id="metaOgVideoUrl" property="og:video:url" content=".*?"/, `id="metaOgVideoUrl" property="og:video:url" content="${escapeHTML(post.videoUrl)}"`);
            outputHtml = outputHtml.replace(/id="metaOgVideoSecureUrl" property="og:video:secure_url" content=".*?"/, `id="metaOgVideoSecureUrl" property="og:video:secure_url" content="${escapeHTML(post.videoUrl)}"`);
            outputHtml = outputHtml.replace(/id="metaOgVideoType" property="og:video:type" content=".*?"/, `id="metaOgVideoType" property="og:video:type" content="video/mp4"`);
            const scriptInclusionStr = `<script src="player.js"></script>`;
            const scriptOverrideStr = `<script>window.FORCE_POST_ID = "${post.id}";</script>\n<script src="player.js"></script>`;
            outputHtml = outputHtml.replace(scriptInclusionStr, scriptOverrideStr);

            // Write the statically compiled file to root
            fs.writeFileSync(fileOutPath, outputHtml, 'utf8');

            // Add dynamic URL Node to sitemap.xml
            sitemapXml += `  <url>\n`;
            sitemapXml += `    <loc>${DOMAIN}/${post.id}.html</loc>\n`;
            sitemapXml += `    <lastmod>${post.date || todayDate}</lastmod>\n`;
            sitemapXml += `    <changefreq>weekly</changefreq>\n`;
            sitemapXml += `    <priority>0.70</priority>\n`;
            sitemapXml += `  </url>\n`;
        });

        // Close the XML structure and save to root
        sitemapXml += `</urlset>\n`;
        fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemapXml, 'utf8');

        console.log("Build compiled successfully! Static files and sitemap.xml generated.");

    } catch (error) {
        console.error("Build Generator Failed: ", error);
        process.exit(1);
    }
}

runBuildGenerator();