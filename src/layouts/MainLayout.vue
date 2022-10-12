<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-grey-10" bordered elevated>
      <q-toolbar class="constrain">
        <q-btn
          class="large-screen-only q-mr-sm"
          icon="eva-camera-outline"
          size="18px"
          to="/camera"
          dense
          flat
          round
        />
        <q-separator class="large-screen-only" vertical spaced />
        <q-toolbar-title class="text-grand-hotel text-bold">
          Quasargram
        </q-toolbar-title>
        <q-separator class="large-screen-only" vertical spaced />
        <q-btn
          class="large-screen-only"
          icon="eva-home-outline"
          size="18px"
          to="/"
          dense
          flat
          round
        />
      </q-toolbar>
    </q-header>

    <q-footer class="bg-white" bordered>
      <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <div v-if="showAppInstallBanner" class="banner-container bg-primary">
          <q-banner
            inline-actions
            dense
            class="bg-primary text-white constrain"
          >
            <template v-slot:avatar>
              <q-avatar
                color="white"
                text-color="grey-10"
                icon="eva-camera-outline"
                font-size="22px"
              />
            </template>
            <b>Install Quasargram?</b>
            <template v-slot:action>
              <q-btn
                @click="installApp"
                class="q-px-sm"
                flat
                label="Yes"
                dense
              />
              <q-btn
                @click="showAppInstallBanner = false"
                class="q-px-sm"
                flat
                label="Later"
                dense
              />
              <q-btn
                @click="neverShowAppInstallBanner"
                class="q-px-sm"
                flat
                label="Never"
                dense
              />
            </template>
          </q-banner>
        </div>
      </transition>
      <q-tabs
        class="text-grey-10 small-screen-only"
        active-color="primary"
        indicator-color="transparent"
      >
        <q-route-tab to="/" icon="eva-home-outline" />
        <q-route-tab to="/camera" icon="eva-camera-outline" />
      </q-tabs>
    </q-footer>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
let deferredPrompt;

export default {
  name: "MainLayout",

  data() {
    return {
      showAppInstallBanner: false,
    };
  },
  methods: {
    installApp() {
      // Hide the app provided install promotion
      this.showAppInstallBanner = false;
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("user accpeted the install prompt");
          this.neverShowAppInstallBanner();
        } else {
          console.log("User dismissed the install prompt");
        }
      });
      // Optionally, send analytics event with outcome of user choice
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      deferredPrompt = null;
    },
    neverShowAppInstallBanner() {
      this.showAppInstallBanner = false;
      this.$q.localStorage.set("neverShowAppInstallBanner", true);
    },
  },
  mounted() {
    let neverShowAppInstallBanner = this.$q.localStorage.getItem(
      "neverShowAppInstallBanner"
    );
    if (!neverShowAppInstallBanner) {
      window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        setTimeout(() => {
          this.showAppInstallBanner = true;
        }, 2000);
        // Optionally, send analytics event that PWA install promo was shown.
        console.log(`'beforeinstallprompt' event was fired.`);
      });
    } else {
      console.log("error");
    }
  },
};
</script>

<style lang="sass">
.q-toolbar
  @media (min-width: $breakpoint-sm-min)
    height: 77px
  .q-toolbar__title
    font-size: 30px
    @media (max-width: $breakpoint-xs-max)
      text-align: center

  .q-tab__icon
    font-size: 30px
</style>
