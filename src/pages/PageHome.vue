<template>
  <q-page class="constrain q-pa-md">
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <template v-if="!loadingPosts && posts.length">
          <q-card
            v-for="post in posts"
            :key="post.id"
            class="card-posts q-mb-md"
            :class="{ 'bg-red-1': post.offline }"
            bordered
            flat
          >
            <q-badge
              v-if="post.offline"
              class="bage-offline red absolute-top-right"
            >
              Stored Offline
            </q-badge>
            <q-item>
              <q-item-section avatar>
                <q-avatar>
                  <img :src="rocket" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-bold">Ul1ra</q-item-label>
                <q-item-label caption>{{ post.location }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-img :src="post.imageUrl" />

            <q-card-section>
              <div>{{ post.caption }}</div>
              <div class="text-caption text-grey">
                {{ post.date | formatDate }}
              </div>
            </q-card-section>
          </q-card>
        </template>
        <template v-else-if="!loadingPosts && !posts.length">
          <h5 class="text-center text-grey">No posts yet</h5>
        </template>
        <template v-else>
          <q-card flat bordered>
            <q-item>
              <q-item-section avatar>
                <q-skeleton type="QAvatar" animation="fade" size="40px" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  <q-skeleton type="text" animation="fade" />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton type="text" animation="fade" />
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-skeleton height="200px" square animation="fade" />

            <q-card-section>
              <q-skeleton type="text" class="text-subtitle2" animation="fade" />
              <q-skeleton
                type="text"
                width="50%"
                class="text-subtitle2"
                animation="fade"
              />
            </q-card-section>
          </q-card>
        </template>
      </div>
      <div class="col-4 large-screen-only">
        <q-item class="fixed">
          <q-item-section avatar>
            <q-avatar size="48px">
              <img :src="rocket" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-bold">Ul1ra</q-item-label>
            <q-item-label caption>Ben Cnningham</q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </div>
  </q-page>
</template>

<script>
import { date } from "quasar";
import { openDB } from "idb";
// Avatar image
import rocket from "../assets/startup3.png";

export default {
  name: "PageHome",
  data() {
    return {
      rocket: rocket,
      posts: [],
      loadingPosts: false,
    };
  },
  methods: {
    getPosts() {
      this.loadingPosts = true;
      this.$axios
        .get(`${process.env.API}/posts`)
        .then((response) => {
          this.posts = response.data;
          // this.posts = []
          this.loadingPosts = false;
          if (!navigator.onLine) {
            this.getOfflinePosts();
          }
        })
        .catch((err) => {
          this.$q.dialog({
            title: "Error",
            message: "Could could not download posts",
          });
          this.loadingPosts = false;
        });
    },
    getOfflinePosts() {
      let db = openDB("workbox-background-sync").then((db) => {
        db.getAll("requests")
          .then((failedRequests) => {
            failedRequests.forEach((failedRequest) => {
              if (failedRequest.queueName == "createPostQueue") {
                let request = new Request(
                  failedRequest.rewuestData.url,
                  failedRequest.rewuestData
                );
                request.formData().then((formData) => {
                  console.log("formData: ", formData);
                  let offlinePost = {};
                  offlinePost.id = formData.get("id");
                  offlinePost.caption = formData.get("caption");
                  offlinePost.location = formData.get("location");
                  offlinePost.date = parsInt(formData.get("date"));
                  offlinePost.offline = true;

                  // grabbing our image file as a base64 url encoded string
                  let reader = new FileReader();
                  reader.readAsDataURL(formData.get("file"));
                  reader.onloadend = () => {
                    offlinePost.imageUrl = reader.result;
                    this.posts.unshift(offlinePost);
                  };
                });
              }
            });
          })
          .catch((err) => {
            console.log("Error accessing IndexedDB: ", err);
          });
      });
    },
    listenForrOfflinePostUploaded() {
      if (this.serviceWorkerSupported) {
        const channel = new BroadcastChannel("sw-messagees");
        channel.addEventListener("message", (event) => {
          console.log("Received", event.data);
        });
      }
    },
  },
  computed: {
    serviceWorkerSupported() {
      if ("ServiceWorker" in navigator) return true;
      return false;
    },
  },
  filters: {
    formatDate(value) {
      return date.formatDate(value, "D MMMM h:mmA");
    },
  },
  created() {
    this.getPosts();
    this.listenForrOfflinePostUploaded();
  },
};
</script>

<style lang="sass">
.card-posts
  .badge-offline
      border-top-left-radius: 0 !important
  .img
    min-height: 200px
</style>
