import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const Schema = mongoose.Schema;

const organizationSchema = new Schema(
  {
    username: {
      // login
      type: String,
      required: true,
    },
    github_id: {
      type: String,
      required: true,
    },
    avatar_url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    location: {
      type: String,
    },
    github_profile_url: {
      // html_url
      type: String,
      required: true,
    },
    organization_createdAt: {
      type: String,
    },
    repositories: {
      type: Array,
    },
    repositories_count: Number,
  },
  { timestamps: true }
);

organizationSchema.plugin(mongoosePaginate);
const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
