import axios from "axios";

export const getPixabayMusic = async (req, res) => {

  try {

    const query = req.query.q || "music";

    // ✅ Check API key
    if (!process.env.FREESOUND_KEY) {
      return res.status(500).json({
        message: "Freesound API key missing"
      });
    }


    const response = await axios.get(
      "https://freesound.org/apiv2/search/text/",
      {
        params: {
          query,
          filter: "duration:[5 TO 60]",
          fields: "id,name,previews",
          page_size: 20
        },
        headers: {
          Authorization: `Token ${process.env.FREESOUND_KEY}`
        }
      }
    );


    if (!response.data?.results) {
      return res.json([]);
    }


    // ✅ Normalize for frontend
    const tracks = response.data.results
      .map(item => {

        const audioUrl =
          item?.previews?.["preview-hq-mp3"] ||
          item?.previews?.["preview-lq-mp3"] ||
          "";

        if (!audioUrl) return null;

        return {
          id: item.id,
          title: item.name || "Unknown",
          audioUrl // 👈 STANDARD FIELD
        };
      })
      .filter(Boolean);


    res.json(tracks);

  } catch (err) {

    console.log(
      "FreeSound Error:",
      err.response?.data || err.message
    );

    res.status(500).json({
      message: "Music fetch failed"
    });

  }
};
