//--------------------------------------------------------------------//
//               _        __ _ _         
//    __ _ _   _| |_ __  / _(_) | ___ 
//   / _` | | | | | '_ \| |_| | |/ _ \
//  | (_| | |_| | | |_) |  _| | |  __/
//   \__, |\__,_|_| .__/|_| |_|_|\___|
//   |___/        |_|          ASCEDIA
//  
// MODIFIED FOR USE ON SALESFORCE MARKETING CLOUD PAGES
//
//  TABLE OF CONTENTS
//  ---
//  01. DEPENDENCIES
//  02. FILE PATHS
//      a.  Base Paths
//      b.  File Paths
//  03. VENDOR - SCRIPTS AND CSS
//  04. HELPER FUNCTIONS
//      a.  forceSourcemapRelativePaths
//  05. TASKS
//      a.  Process Styles
//      b.  Process JavaScript
//      c.  Process Images
//      d.  Copy Fonts
//      e.  Copy Favicons
//      f.  Copy Icon Fonts
//      g.  File Watching
//      h.  Clean Distributable Files
//      i.  Build Distributable Files
//  
//--------------------------------------------------------------------//

//--------------------------------------------------------------------//
//  01. DEPENDENCIES
//--------------------------------------------------------------------//
import { src, dest, series, parallel, watch } from 'gulp';
import autoprefixer from 'autoprefixer';
import babel from 'gulp-babel';
import cssnano from 'cssnano';
import { deleteSync } from 'del';
import gulpIf from 'gulp-if';
import gulpSass from 'gulp-sass';
import gulpSharp from 'gulp-sharp-optimize-images';
import { optimize as svgo} from 'svgo';
import path from 'path';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import * as sassLib from 'sass';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import through2 from 'through2';
import { URL } from 'url';
import fs from 'fs';


const sass = gulpSass(sassLib);

//--------------------------------------------------------------------//
//  02. FILE PATHS
//--------------------------------------------------------------------//
//  •   Define file source and destination paths for markup, Sass, CSS, 
//      JavaScript, and images
//  •   Can point to a directory of files, single file, or specfic 
//      file types in a directory
//--------------------------------------------------------------------//
//      a.  Base Paths
//          •   Define base paths for source code (src) and 
//              production ready code (dist)
//--------------------------------------------------------------------//
const basePath = {
    src: './assets/src',
    dist: './assets/dist',
    nodeModules: './node_modules'
};

//--------------------------------------------------------------------//
//      b.  File Paths
//          Define paths for file types
//--------------------------------------------------------------------//
const filePath = {
    styles: {
        src: `${basePath.src}/scss`,
        dist: `${basePath.dist}/css`,
    },
    scripts: {
        src: `${basePath.src}/js`,
        dist: `${basePath.dist}/js`,
    },
    images: {
        src: `${basePath.src}/img`,
        dist: `${basePath.dist}/img`,
    },
    favicons: {
        src: `${basePath.src}/favicons`,
        dist: `${basePath.dist}/favicons`,
    },
    fonts: {
        src: `${basePath.src}/fonts`,
        dist: `${basePath.dist}/fonts`,
    },
};

//--------------------------------------------------------------------//
//  03. VENDOR - SCRIPTS AND CSS
//--------------------------------------------------------------------//
let vendor = {
    scripts: [
        //`${basePath.nodeModules}/@choctawnationofoklahoma/lite-vimeo/dist/lite-vimeo.js`,
        //`${basePath.nodeModules}/@justinribeiro/lite-youtube/lite-youtube.js`,
        `${basePath.nodeModules}/bootstrap/dist/js/bootstrap.bundle.js`,
        //`${basePath.nodeModules}/simple-aos/dist/aos.js`,
        //`${basePath.nodeModules}/swiper/swiper-bundle.js`,
    ],
    css: [
        //`${basePath.nodeModules}/swiper/swiper-bundle.min.css`,
    ]
};

//--------------------------------------------------------------------//
//  04. HELPER FUNCTIONS
//--------------------------------------------------------------------//
//  forceSourcemapRelativePaths
//  •   fixes issue in gulp-sass where files are mapped based
//      on the full file path not relative path.
//-------------------------------------------------------------------//
function forceSourcemapRelativePaths() {
    return through2.obj((file, _, cb) => {
        if (file.sourceMap) {
            file.sourceMap.sources = file.sourceMap.sources.map((source) => {
                if (source.startsWith('file:/')) {
                    source = new URL(source).pathname.replace(/^\/+/, '');
                }
                if (path.isAbsolute(source)) {
                    source = path.relative(path.dirname(file.path), source);
                }
                return source.replace(/\\/g, '/');
            });
        }
        cb(null, file);
    });
}

//--------------------------------------------------------------------//
//  ***                                                               
//--------------------------------------------------------------------//
//
//  Unless you are adding new tasks or file watches, you should
//  not need to edit anything beyond this point
//
//--------------------------------------------------------------------//
//  ***                                                               
//--------------------------------------------------------------------//

//--------------------------------------------------------------------//
//  05. TASKS
//--------------------------------------------------------------------//
//      a.  Process Styles
//--------------------------------------------------------------------//
//--------------------------------------------------------------------//
//          1.  Process Main Styles
//--------------------------------------------------------------------//
function mainStyles() {
    if (!fs.existsSync(filePath.styles.src)) { return Promise.resolve(); }
    return src(`${filePath.styles.src}/*.scss`)
        .pipe(sourcemaps.init())
        .pipe(sass.sync({ silenceDeprecations: [ 'mixed-decls', 'color-functions', 'global-builtin', 'import'] }).on('error', sass.logError))
        .pipe(dest(filePath.styles.dist))
        .pipe(rename({ suffix: '.min' }))
        .pipe(postcss([autoprefixer, cssnano]))
        .pipe(forceSourcemapRelativePaths())
        .pipe(sourcemaps.write('.'))
        .pipe(dest(filePath.styles.dist));
}
//--------------------------------------------------------------------//
//          2.  Process Vendor Styles
//--------------------------------------------------------------------//
function vendorStyles() {
    if (!vendor.css || vendor.css.length === 0) { return Promise.resolve(); }
    return src(vendor.css)
        .pipe(dest(filePath.styles.dist));
}
//--------------------------------------------------------------------//
//          3. Process All CSS
//--------------------------------------------------------------------//
const styles =  series(
    mainStyles,
    vendorStyles,
);

//--------------------------------------------------------------------//
//      b.  Process JavaScript
//--------------------------------------------------------------------//
//--------------------------------------------------------------------//
//          1.  Process Main Scripts
//--------------------------------------------------------------------//
function mainScripts() {
    if (!fs.existsSync(filePath.scripts.src)) { return Promise.resolve(); }
    return src(`${filePath.scripts.src}/*.js`, { sourcemaps: true })
        .pipe(babel({ presets: ['@babel/preset-env'] }))
        .pipe(dest(filePath.scripts.dist))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(dest(filePath.scripts.dist, { sourcemaps: '.' }));
}
//--------------------------------------------------------------------//
//          2.  Vendor Scripts
//--------------------------------------------------------------------//
function vendorScripts() {
    if (!vendor.scripts || vendor.scripts.length === 0) { return Promise.resolve(); }
    return src(vendor.scripts, {encoding: 'utf8', sourcemaps: true })
        .pipe(
            // Check if the file is aos.js
            gulpIf((file) => file.basename === 'aos.js', 
                replace(/\w\.push.\[\w\.id,.*""\]\);/g, '')  // Replace part of the file content
            )
        )
        .pipe(dest(filePath.scripts.dist))
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(dest(filePath.scripts.dist, { sourcemaps: '.' }));
}

//--------------------------------------------------------------------//
//          3. Process Scripts
//--------------------------------------------------------------------//
const scripts = series(
    mainScripts,
    vendorScripts,
);

//--------------------------------------------------------------------//
//      c.  Image Optimization
//          for settings ref: https://sharp.pixelplumbing.com/api-output
//--------------------------------------------------------------------//
function images() {
    if (!fs.existsSync(filePath.images.src)) { return Promise.resolve(); }
    return src(`${filePath.images.src}/**/*`)
        .pipe(gulpSharp({
            webp_to_webp: {},
            avif_to_avif: {},
            gif_to_gif: {},
            jpg_to_jpg: {
                quality: 95,        // Quality level from 0 to 100, lower means more compression
                progressive: true,  // Progressive encoding (good for web images)
                mozjpeg: true,      // Use mozjpeg for better compression 
            },
            jpg_to_avif: {},
            png_to_png: { 
                compressionLevel: 9,      // Maximum zlib compression level (lossless)
                quality: 100,             // Only applies to lossy compression, but for consistency, set to 100
                effort: 9,                // Maximum optimization effort
                palette: false,           // Ensures no reduction to a palette
                progressive: false,       // Non-interlaced PNGs for exact quality retention
                adaptiveFiltering: true,  // Improves compression while maintaining lossless quality
            },
            png_to_avif: {},
        }))
        .pipe(
            through2.obj(function (file, _, callback) {
                if (file.extname === '.svg') {
                    const optimized = svgo(file.contents.toString(), {
                        plugins: [
                            { name: 'removeViewBox', active: false },
                            { name: 'removeDimensions', active: true },
                            { name: 'removeMetadata', active: true },
                            { name: 'removeTitle', active: true },
                        ],
                    });
                    file.contents = Buffer.from(optimized.data);
                }
                callback(null, file);
            })
          )
        .pipe(dest(filePath.images.dist));
}
//--------------------------------------------------------------------//
//      d.  Copy Fonts
//--------------------------------------------------------------------//
function fonts() {
    if (!fs.existsSync(filePath.fonts.src)) { return Promise.resolve(); }
    return src(`${filePath.fonts.src}/**/*`, {encoding: false })
    .pipe(dest(filePath.fonts.dist));
}
//--------------------------------------------------------------------//
//      e.  Copy Favicons
//--------------------------------------------------------------------//
function favicons() {
    if (!fs.existsSync(filePath.favicons.src)) { return Promise.resolve(); }
    return src(`${filePath.favicons.src}/**/*`, {encoding: false })
    .pipe(dest(filePath.favicons.dist));
}

//--------------------------------------------------------------------//
//      g.  File Watching
//--------------------------------------------------------------------//
function fileWatch() {
    watch([`${filePath.styles.src}/**/*.scss`], { interval: 1000 }, mainStyles);
    watch([`${filePath.scripts.src}/**/*.js`], { interval: 1000 }, mainScripts);
    watch([`${filePath.images.src}/**/*.{png,jpg,jpeg,svg,gif,webp,avif}`], { interval: 1000 }, images);
    watch(filePath.favicons.src, { interval: 1000 }, favicons);
    watch(filePath.fonts.src, { interval: 1000 }, fonts);
}

//--------------------------------------------------------------------//
//      g.  Clean Distributable Files
//--------------------------------------------------------------------//
async function clean() {
    await deleteSync([`${basePath.dist}/**/*`]);
}

//--------------------------------------------------------------------//
//      h.  Build Distributable Files
//--------------------------------------------------------------------//
const build = series(clean, styles, scripts, images, fonts, favicons);


//--------------------------------------------------------------------//
//  EXPORTS
//--------------------------------------------------------------------//
export {
    build,
    build as default,
    clean,
    fonts,
    favicons,
    fileWatch as watch,
    images,
    styles,
    scripts,
};