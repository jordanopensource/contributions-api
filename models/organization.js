import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const Schema = mongoose.Schema;

/* Creating a schema for the organization model. */
const organizationSchema = new Schema(
  {
    /* The login/username of the organization */
    username: {
      type: String,
      required: true,
    },
    /* The id of the organization on github. */
    github_id: {
      type: String,
      required: true,
    },
    /* The url of the organization's profile picture. */
    avatar_url: {
      type: String,
      required: true,
    },
    /* The name of the organization */
    name: {
      type: String,
    },
    /* The location of the organization */
    location: {
      type: String,
    },
    /* The url of the organization's profile on github. */
    github_profile_url: {
      type: String,
      required: true,
    },
    /* The date the organization was created. */
    organization_createdAt: {
      type: String,
    },
    /* An array of the repositories of the organization. */
    repositories: {
      type: Array,
    },
    /* An array of the members of the organization. */
    members: {
      type: Array,
    },
    repositories_count: Number,
  },
  { timestamps: true }
);

/* A plugin that allows us to paginate the data. */
organizationSchema.plugin(mongoosePaginate);
/* Creating a model for the organization schema. */
const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
