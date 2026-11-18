'use strict';
// No Google request is made until the editor supplies the real GA4 ID.
(()=>{
 const root=document.documentElement;
 if(window.newsisAnalyticsStarted)return;
 const element=document.getElementById('article-analytics-settings');if(!element)return;
 let settings;try{settings=JSON.parse(element.textContent)}catch{root.dataset.analyticsStatus='invalid-settings';return}
 const id=settings.measurementId;
 if(!id){root.dataset.analyticsStatus='needs-id';return}
 if(!/^G-[A-Z0-9]{6,20}$/.test(id)){root.dataset.analyticsStatus='invalid-id';return}
 if(location.hostname!==settings.productionHost){root.dataset.analyticsStatus='preview';return}
 window.newsisAnalyticsStarted=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 // The reading stops are parts of one article, not separate page views.
 // Before activation, also disable GA4 Enhanced Measurement's browser-history
 // pageviews in the property's web stream; send_page_view does not override it.
 window.gtag('config',id,{send_page_view:false});
 window.gtag('event','page_view',{send_to:id,page_title:document.title,page_location:location.origin+location.pathname+location.search});
 const tag=document.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);tag.dataset.newsisGoogleTag='true';
 root.dataset.analyticsStatus='loading';
 tag.onload=()=>{root.dataset.analyticsStatus='loaded'};
 tag.onerror=()=>{root.dataset.analyticsStatus='blocked'};
 document.head.append(tag);
})();
