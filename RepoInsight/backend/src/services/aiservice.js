import axios from "axios";

export const queryAI = async (data) => {
  const res = await axios.post("http://localhost:8000/query", data);
  return res.data;
};