import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const Schema = mongoose.Schema;

/* Creating a schema for the user model. */
const userSchema = new Schema(
  {
    /* The login/username of the user. */
    username: {
      type: String,
      required: true,
    },
    /* The id of the user on github. */
    github_id: {
      type: String,
      required: true,
    },
    /* The url of the user's profile picture. */
    avatar_url: {
      type: String,
    },
    /* The name of the user. */
    name: {
      type: String,
    },
    /* The location of the user. */
    location: {
      type: String,
    },
    /* The bio of the user. */
    bio: {
      type: String,
    },
    /* The company that the user works in. */
    company: {
      type: String,
    },
    /* A boolean value that tells us if the user is looking for a job. */
    isHireable: {
      type: Boolean,
    },
    /* The url of the user's profile on github. */
    github_profile_url: {
      type: String,
    },
    /* The date when the user was created on github. */
    user_createdAt: {
      type: String,
    },
    /* An array of objects that contains the number of commits that the user has made on each day. */
    commit_contributions: {
      type: Array,
    },
    /* The score is a number that is calculated based on the number of commits that the user has made. */
    score: {
      type: Number,
    },
    /* A boolean value that tells us if the user is a member of the JOSA organization on github. */
    isJOSAMember: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* A plugin that allows us to paginate the results of a query. */
userSchema.plugin(mongoosePaginate);
/* Creating a model for the user schema. */
const User = mongoose.model("User", userSchema);

export default User;
