// @ts-check
// Welcome bot for react-native-video discussions. On a newly created discussion
// it posts a short welcome comment (labels are handled by the category forms).
// handleDiscussion() is the entry point and does the GitHub IO.

// Per-category welcome comment, keyed by the discussion category slug.
// Categories not listed here (Announcements, General) are left untouched.
/** @type {Record<string, string>} */
const COMMENT = {
  ideas: 'Thanks for sharing this idea! 🙏 We will take a look, and others can chime in with 👍 and comments.',
  'q-a': 'Thanks for the question! 🙏 The community and maintainers will help when they can. Once something solves it, please mark it as the answer so others can find it.',
  'show-and-tell': 'Thanks for sharing what you built! 🎬 We love seeing react-native-video out in the wild.',
  polls: 'Thanks for starting this poll! 🗳️ Cast your vote and let the community weigh in.',
};

/** @typedef {import('@octokit/rest').Octokit} Octokit */
/**
 * @typedef {Object} Discussion
 * @property {string} node_id
 * @property {number} number
 * @property {{ slug?: string, name?: string }} [category]
 */
/**
 * @typedef {Object} Context
 * @property {{ owner: string, repo: string }} repo
 * @property {{ discussion?: Discussion, action?: string }} payload
 */

const ADD_COMMENT = `mutation($id:ID!,$body:String!){
  addDiscussionComment(input:{ discussionId:$id, body:$body }){ comment{ id } }
}`;

/** @param {{ github: Octokit, context: Context }} args */
async function handleDiscussion({ github, context }) {
  const discussion = context.payload.discussion;
  if (!discussion) return;

  const slug = discussion.category && discussion.category.slug;
  const comment = slug ? COMMENT[slug] : undefined;
  if (!comment) {
    console.log(`No welcome comment for category "${slug}" -> skipping`);
    return;
  }

  await github.graphql(ADD_COMMENT, { id: discussion.node_id, body: comment });
}

module.exports = handleDiscussion;
