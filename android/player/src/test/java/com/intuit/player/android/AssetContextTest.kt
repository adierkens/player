package com.intuit.player.android

import android.content.Context
import com.intuit.player.android.asset.RenderableAsset
import com.intuit.player.jvm.core.asset.Asset
import io.mockk.every
import io.mockk.mockk
import io.mockk.spyk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

internal class AssetContextTest {
    private val context = spyk<Context>()
    private val context2 = spyk<Context>()
    private var asset = mockk<Asset>()
    private val player = AndroidPlayer()
    private var renderable = mockk<RenderableAsset>()
    private val factory = { _: AssetContext -> renderable }
    lateinit var assetContext: AssetContext

    @BeforeEach
    fun setup() {
        every { asset.id } returns "some-id"
        assetContext = AssetContext(
            context = context,
            asset = asset,
            player = player,
            factory = factory,
        )
    }

    @Test
    fun assetContext() {
        assertEquals(context, assetContext.context)
        assertEquals(asset, assetContext.asset)
        assertEquals("some-id", assetContext.id)
        assertEquals(player, assetContext.player)
        assertEquals(renderable, assetContext.factory.invoke(assetContext))
    }

    @Test
    fun assetContextHelpers() {
        val assetContext = AssetContext(
            context = context,
            asset = asset,
            player = player,
            factory = factory,
        )

        assertEquals(renderable, assetContext.build())
        assertEquals(assetContext, assetContext.withStyles())
        assertNotEquals(assetContext, assetContext.withContext(context2))
    }

    @Test
    fun postFixId() {
        val newContext = assetContext.withTag("tag")
        assertEquals("some-id-tag", newContext.id)
    }
}
