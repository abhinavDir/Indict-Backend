import axios from "axios";
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

/* ================= CONFIG ================= */

const parser = new Parser();

const NEWS_API = process.env.NEWS_API_KEY;
const GNEWS_API = process.env.GNEWS_API_KEY;
const GUARDIAN_API = process.env.GUARDIAN_API_KEY;
const MEDIASTACK = process.env.MEDIASTACK_KEY;

/* ================= CLEAN ================= */

const cleanText = (text = "") => {
  if (!text) return "";

  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/* ================================================= */
/* ================= NEWS API ====================== */
/* ================================================= */

export const getNewsAPI = async (page = 1) => {
  try {
    if (!NEWS_API) return [];

    const r = await axios.get(
      "https://newsapi.org/v2/everything",
      {
        params: {
          q: "education technology science",
          apiKey: NEWS_API,
          pageSize: 20,
          page,
          sortBy: "publishedAt",
          language: "en",
        },
        timeout: 15000,
      }
    );

    return r.data.articles.map((b, i) => ({
      _id: `news_${page}_${i}`,
      title: b.title,
      description: cleanText(b.description || b.content),
      image: b.urlToImage,
      author: { username: b.source?.name || "NewsAPI" },
      createdAt: b.publishedAt,
      source: "NewsAPI",
      isExternal: true,
      externalUrl: b.url,
    }));
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= GNEWS ========================= */
/* ================================================= */

export const getGNews = async (page = 1) => {
  try {
    if (!GNEWS_API) return [];

    const r = await axios.get(
      "https://gnews.io/api/v4/search",
      {
        params: {
          q: "education technology science",
          token: GNEWS_API,
          max: 20,
          page,
          lang: "en",
        },
        timeout: 15000,
      }
    );

    return r.data.articles.map((b, i) => ({
      _id: `gnews_${page}_${i}`,
      title: b.title,
      description: cleanText(b.description),
      image: b.image,
      author: { username: b.source?.name || "GNews" },
      createdAt: b.publishedAt,
      source: "GNews",
      isExternal: true,
      externalUrl: b.url,
    }));
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= GUARDIAN ====================== */
/* ================================================= */

export const getGuardian = async (page = 1) => {
  try {
    if (!GUARDIAN_API) return [];

    const r = await axios.get(
      "https://content.guardianapis.com/search",
      {
        params: {
          q: "education technology science",
          "show-fields": "trailText,thumbnail",
          "api-key": GUARDIAN_API,
          page,
          pageSize: 20,
          orderBy: "newest",
        },
        timeout: 15000,
      }
    );

    return r.data.response.results.map((b, i) => ({
      _id: `guardian_${page}_${i}`,
      title: b.webTitle,
      description: cleanText(b.fields?.trailText),
      image: b.fields?.thumbnail,
      author: { username: "Guardian" },
      createdAt: b.webPublicationDate,
      source: "Guardian",
      isExternal: true,
      externalUrl: b.webUrl,
    }));
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= DEV.TO ======================== */
/* ================================================= */

export const getDevTo = async (page = 1) => {
  try {
    const r = await axios.get(
      "https://dev.to/api/articles",
      {
        params: {
          tag: "education",
          per_page: 20,
          page,
        },
        timeout: 15000,
      }
    );

    return r.data.map((b, i) => ({
      _id: `dev_${page}_${i}`,
      title: b.title,
      description: cleanText(b.description),
      image: b.cover_image,
      author: { username: b.user?.name || "Dev.to" },
      createdAt: b.published_at,
      source: "Dev.to",
      isExternal: true,
      externalUrl: b.url,
    }));
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= HACKER NEWS =================== */
/* ================================================= */

export const getHackerNews = async () => {
  try {
    const ids = await axios.get(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );

    const top = ids.data.slice(0, 20);

    const posts = await Promise.all(
      top.map((id) =>
        axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        )
      )
    );

    return posts.map((p, i) => ({
      _id: `hn_${i}`,
      title: p.data.title,
      description: cleanText(p.data.title),
      image: null,
      author: { username: p.data.by || "HN" },
      createdAt: new Date(p.data.time * 1000),
      source: "HackerNews",
      isExternal: true,
      externalUrl: p.data.url,
    }));
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= ARXIV ========================= */
/* ================================================= */

export const getArxiv = async () => {
  try {
    const r = await axios.get(
      "http://export.arxiv.org/api/query",
      {
        params: {
          search_query: "education",
          max_results: 20,
          sortBy: "submittedDate",
          sortOrder: "descending",
        },
      }
    );

    const $ = cheerio.load(r.data, {
      xmlMode: true,
    });

    const res = [];

    $("entry").each((i, el) => {
      res.push({
        _id: `arxiv_${i}`,
        title: $(el).find("title").text(),
        description: cleanText(
          $(el).find("summary").text()
        ),
        image: null,
        author: { username: "ArXiv" },
        createdAt: $(el).find("published").text(),
        source: "ArXiv",
        isExternal: true,
        externalUrl: $(el).find("id").text(),
      });
    });

    return res;
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= OPENLIBRARY =================== */
/* ================================================= */

export const getOpenLibrary = async () => {
  try {
    const r = await axios.get(
      "https://openlibrary.org/search.json",
      {
        params: {
          q: "education",
          limit: 20,
        },
      }
    );

    return r.data.docs.map((b, i) => ({
      _id: `book_${i}`,
      title: b.title,
      description: cleanText(b.first_sentence),
      image: null,
      author: {
        username: b.author_name?.[0] || "Author",
      },
      createdAt: new Date(),
      source: "OpenLibrary",
      isExternal: true,
      externalUrl: `https://openlibrary.org${b.key}`,
    }));
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= WIKIPEDIA ===================== */
/* ================================================= */

export const getWikipedia = async () => {
  try {
    const r = await axios.get(
      "https://en.wikipedia.org/api/rest_v1/page/random/summary"
    );

    return [
      {
        _id: `wiki_${Date.now()}`,
        title: r.data.title,
        description: cleanText(r.data.extract),
        image: r.data.thumbnail?.source,
        author: { username: "Wikipedia" },
        createdAt: new Date(),
        source: "Wikipedia",
        isExternal: true,
        externalUrl:
          r.data.content_urls.desktop.page,
      },
    ];
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= MEDIASTACK ==================== */
/* ================================================= */

export const getMediaStack = async (offset = 0) => {
  try {
    if (!MEDIASTACK) return [];

    const res = await axios.get(
      "http://api.mediastack.com/v1/news",
      {
        params: {
          access_key: MEDIASTACK,
          categories: "education,technology,science",
          languages: "en",
          limit: 20,
          offset,
        },
        timeout: 15000,
      }
    );

    return (res.data?.data || []).map(
      (b, i) => ({
        _id: `media_${offset}_${i}`,
        title: b.title,
        description: cleanText(
          b.description || b.content
        ),
        image: b.image,
        author: {
          username: b.source || "MediaStack",
        },
        createdAt: b.published_at,
        source: "MediaStack",
        isExternal: true,
        externalUrl: b.url,
      })
    );
  } catch {
    return [];
  }
};

/* ================================================= */
/* ================= MASTER ======================== */
/* ================================================= */

export const getAllExternalBlogs = async () => {
  console.log("🌐 Fetching fresh blogs...");

  const pages = [1, 2];

  const data = await Promise.all([
    ...pages.map((p) => getNewsAPI(p)),
    ...pages.map((p) => getGNews(p)),
    ...pages.map((p) => getGuardian(p)),
    ...pages.map((p) => getDevTo(p)),

    getHackerNews(),
    getArxiv(),
    getOpenLibrary(),
    getWikipedia(),

    getMediaStack(0),
    getMediaStack(20),
  ]);

  let all = data.flat();

  /* Remove duplicates */
  const seen = new Set();

  all = all.filter((b) => {
    if (!b.externalUrl) return false;

    if (seen.has(b.externalUrl)) return false;

    seen.add(b.externalUrl);

    return true;
  });

  /* Sort newest first */
  all.sort(
    (a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
  );

  return all;
};
