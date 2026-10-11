<?php

/**
 * Plugin Name: Services Add-on Calculator
 * Description: Services CPT with live add-on price calculator.
 * Version: 1.0.0
 */
if (! defined('ABSPATH')) exit;

/* 1. CPT + meta */
add_action('init', function () {
    register_post_type('service', [
        'labels'       => ['name' => 'Services', 'singular_name' => 'Service'],
        'public'       => true,
        'show_in_rest' => true,
        'menu_icon'    => 'dashicons-hammer',
        'supports'     => ['title', 'editor', 'thumbnail'],
    ]);

    register_post_meta('service', 'base_price', [
        'type' => 'number',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'floatval',
        'auth_callback' => fn() => current_user_can('edit_posts'),
    ]);
    register_post_meta('service', 'delivery_time_days', [
        'type' => 'integer',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'absint',
        'auth_callback' => fn() => current_user_can('edit_posts'),
    ]);
});

/* Meta box */
add_action('add_meta_boxes', function () {
    add_meta_box('sac_details', 'Service Details', 'sac_meta_box', 'service');
});

function sac_meta_box($post)
{
    wp_nonce_field('sac_save', 'sac_nonce');
    $price = get_post_meta($post->ID, 'base_price', true);
    $days  = get_post_meta($post->ID, 'delivery_time_days', true);
?>
    <p><label>Base Price ($)<br>
            <input type="number" step="0.01" min="0" name="base_price" value="<?php echo esc_attr($price); ?>"></label></p>
    <p><label>Delivery Time (days)<br>
            <input type="number" min="0" name="delivery_time_days" value="<?php echo esc_attr($days); ?>"></label></p>
    <?php
}

add_action('save_post_service', function ($post_id) {
    if (
        ! isset($_POST['sac_nonce']) ||
        ! wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['sac_nonce'])), 'sac_save')
    ) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (! current_user_can('edit_post', $post_id)) return;

    if (isset($_POST['base_price'])) {
        update_post_meta($post_id, 'base_price', (float) wp_unslash($_POST['base_price']));
    }
    if (isset($_POST['delivery_time_days'])) {
        update_post_meta($post_id, 'delivery_time_days', absint(wp_unslash($_POST['delivery_time_days'])));
    }
});

/* 2. Assets: sirf register, enqueue shortcode ke andar */
add_action('wp_enqueue_scripts', function () {
    wp_register_style('sac-style', plugins_url('assets/calculator.css', __FILE__), [], '1.0.0');
    wp_register_script(
        'sac-calculator',
        plugins_url('assets/calculator.js', __FILE__),
        [],
        '1.0.0',
        ['in_footer' => true, 'strategy' => 'defer']
    );
});

/* 3. Shortcode */
add_shortcode('recent_services', function () {
    wp_enqueue_style('sac-style');
    wp_enqueue_script('sac-calculator');

    $addons = [
        'priority' => ['label' => 'Priority Turnaround', 'price' => 50],
        'revision' => ['label' => 'Extra Revision',      'price' => 20],
        'support'  => ['label' => '30-Day Support',      'price' => 30],
    ];

    $q = new WP_Query([
        'post_type'      => 'service',
        'posts_per_page' => 3,
        'orderby'        => 'modified',
        'order'          => 'DESC',
        'no_found_rows'  => true,
    ]);

    if (! $q->have_posts()) return '<p>No services found.</p>';

    ob_start();
    echo '<div class="sac-wrap">';
    while ($q->have_posts()) {
        $q->the_post();
        $base = (float) get_post_meta(get_the_ID(), 'base_price', true);
        $days = (int) get_post_meta(get_the_ID(), 'delivery_time_days', true);
    ?>
        <div class="sac-service" data-base="<?php echo esc_attr($base); ?>">
            <h3><?php echo esc_html(get_the_title()); ?></h3>
            <p>Delivery: <?php echo esc_html($days); ?> days</p>
            <?php foreach ($addons as $key => $a) : ?>
                <label>
                    <input type="checkbox" class="sac-addon" data-price="<?php echo esc_attr($a['price']); ?>">
                    <?php echo esc_html($a['label']); ?> (+$<?php echo esc_html($a['price']); ?>)
                </label><br>
            <?php endforeach; ?>
            <p class="sac-total">Estimated: $<span class="sac-price"><?php echo esc_html(number_format($base, 2)); ?></span></p>
        </div>
<?php
    }
    echo '</div>';
    wp_reset_postdata();
    return ob_get_clean();
});
